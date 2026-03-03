import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey: key });
}

function getSystemPrompt(locale: string): string {
  const lang = locale === 'es' ? 'Spanish' : 'English';
  return `You are Ancalofa Wealth Assistant, an AI financial advisor for the Fajardo López family.
Always respond in ${lang}. Be concise, accurate, and family-friendly.
The family has investments at Skandia Colombia (funds SKA-CAR-001 and SKA-JUA-001).
Use the available tools to query real portfolio data before answering financial questions.
Format currency as COP with $ symbol. Percentages to 1-2 decimal places.`;
}

// ── GET — sessions or messages ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      const messages = db.prepare(
        'SELECT * FROM chat_messages WHERE session_id=? ORDER BY created_at ASC'
      ).all(sessionId);
      return NextResponse.json(messages);
    }

    const sessions = db.prepare(
      'SELECT * FROM chat_sessions ORDER BY updated_at DESC LIMIT 20'
    ).all();
    return NextResponse.json(sessions);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ── DELETE — delete session ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    db.prepare('DELETE FROM chat_sessions WHERE session_id=?').run(sessionId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ── POST — send message (SSE streaming) ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  function send(data: unknown): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const db = getDb();
        const { message, session_id, locale = 'es' } = await req.json();

        if (!message?.trim()) {
          controller.enqueue(send({ type: 'error', error: 'Empty message' }));
          controller.close();
          return;
        }

        // Get or create session
        let sessionId = session_id as string | null;
        if (!sessionId) {
          sessionId = `sess_${Date.now()}`;
          const title = message.slice(0, 60);
          db.prepare(
            `INSERT INTO chat_sessions (session_id, title, created_at, updated_at) VALUES (?,?,datetime('now'),datetime('now'))`
          ).run(sessionId, title);
        }

        // Save user message
        db.prepare(
          `INSERT INTO chat_messages (session_id, role, content, created_at) VALUES (?,?,?,datetime('now'))`
        ).run(sessionId, 'user', message);

        // Load history
        const history = db.prepare(
          'SELECT role, content FROM chat_messages WHERE session_id=? ORDER BY created_at ASC'
        ).all(sessionId) as Array<{ role: string; content: string }>;

        const anthropicMessages = history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        // Get portfolio tools
        const { getTools, executeTool } = await import('@/lib/chat-tools');
        const tools = getTools();

        // Stream from Anthropic
        const client = getClient();
        let accumulated = '';
        const toolCallNames: string[] = [];

        let continueLoop = true;
        let currentMessages = [...anthropicMessages];

        while (continueLoop) {
          const response = await client.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1024,
            system: getSystemPrompt(locale),
            messages: currentMessages,
            tools,
            stream: true,
          });

          let currentToolName = '';
          let currentToolInput = '';
          let currentToolId = '';
          let stopReason = '';
          const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];
          const assistantContent: Anthropic.ContentBlock[] = [];

          for await (const event of response) {
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'tool_use') {
                currentToolName = event.content_block.name;
                currentToolId = event.content_block.id;
                currentToolInput = '';
                toolCallNames.push(currentToolName);
                controller.enqueue(send({ type: 'tool_call', tool: currentToolName }));
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                accumulated += event.delta.text;
                controller.enqueue(send({ type: 'text', content: event.delta.text }));
              } else if (event.delta.type === 'input_json_delta') {
                currentToolInput += event.delta.partial_json;
              }
            } else if (event.type === 'content_block_stop') {
              if (currentToolName) {
                let toolInput = {};
                try { toolInput = JSON.parse(currentToolInput); } catch { /* ok */ }
                const toolResult = await executeTool(currentToolName, toolInput);
                toolResults.push({ type: 'tool_result', tool_use_id: currentToolId, content: JSON.stringify(toolResult) });
                assistantContent.push({ type: 'tool_use', id: currentToolId, name: currentToolName, input: toolInput });
                currentToolName = '';
              }
            } else if (event.type === 'message_delta') {
              stopReason = event.delta.stop_reason || '';
            } else if (event.type === 'message_start') {
              // start tracking content blocks
            }
          }

          if (accumulated && !toolResults.length) {
            assistantContent.push({ type: 'text', text: accumulated });
          }

          currentMessages = [
            ...currentMessages,
            { role: 'assistant' as const, content: assistantContent },
          ];

          if (toolResults.length > 0) {
            currentMessages.push({ role: 'user' as const, content: toolResults });
          } else {
            continueLoop = false;
          }

          if (stopReason === 'end_turn' && toolResults.length === 0) {
            continueLoop = false;
          }
        }

        // Save assistant message
        db.prepare(
          `INSERT INTO chat_messages (session_id, role, content, tool_calls, created_at) VALUES (?,?,?,?,datetime('now'))`
        ).run(sessionId, 'assistant', accumulated, toolCallNames.length ? JSON.stringify(toolCallNames) : null);

        // Update session timestamp
        db.prepare(`UPDATE chat_sessions SET updated_at=datetime('now') WHERE session_id=?`).run(sessionId);

        controller.enqueue(send({ type: 'done', session_id: sessionId, tool_calls: toolCallNames }));
      } catch (err) {
        controller.enqueue(send({ type: 'error', error: String(err) }));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
