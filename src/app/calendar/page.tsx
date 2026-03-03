'use client';

import { useEffect, useState } from 'react';
import { Calculator, CalendarCheck, Clock, CheckCircle, Circle } from 'lucide-react';
import api from '@/lib/api';
import type { DianCalendarEvent } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/lib/formatters';
import { useToast } from '@/hooks/useToast';
import MetricCard from '@/components/ui/MetricCard';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ToastContainer from '@/components/ui/Toast';

const typeColorMap: Record<string, 'error' | 'info' | 'warning' | 'purple' | 'success' | 'default'> = {
  renta: 'error',
  iva: 'info',
  retencion: 'warning',
  exogena: 'purple',
  patrimonio: 'success',
  other: 'default',
};

type EventType = 'all' | 'renta' | 'iva' | 'retencion' | 'exogena' | 'patrimonio';

export default function CalendarPage() {
  const { t } = useLocale();
  const { toasts, showToast, dismissToast } = useToast();
  const [events, setEvents] = useState<DianCalendarEvent[]>([]);
  const [filterType, setFilterType] = useState<EventType>('all');

  const load = () => {
    api.getDianEvents().then(setEvents);
  };

  useEffect(() => { load(); }, []);

  const today = new Date();
  const getDaysUntil = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const withDays = events.map(e => ({ ...e, daysUntil: getDaysUntil(e.due_date) }));
  const pending = withDays.filter(e => !e.is_completed);
  const nextEvent = pending.sort((a, b) => a.daysUntil - b.daysUntil).find(e => e.daysUntil >= 0);

  const filtered = filterType === 'all'
    ? withDays
    : withDays.filter(e => e.event_type === filterType);

  const handleToggle = async (eventId: number) => {
    await api.toggleDianEventCompleted(eventId);
    load();
    showToast(t('calendar.event_updated'), 'success');
  };

  const getCardStyle = (event: typeof withDays[0]) => {
    if (event.is_completed) return 'border-l-green-500 bg-green-50/20';
    if (event.daysUntil < 0) return 'border-l-red-500 bg-red-50/30';
    if (event.daysUntil <= 30) return 'border-l-orange-400 bg-orange-50/20';
    return 'border-l-gray-300';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const typeFilters: { value: EventType; label: string }[] = [
    { value: 'all', label: t('calendar.all_types') },
    { value: 'renta', label: t('calendar.renta') },
    { value: 'iva', label: t('calendar.iva') },
    { value: 'retencion', label: t('calendar.retencion') },
    { value: 'exogena', label: t('calendar.exogena') },
    { value: 'patrimonio', label: t('calendar.patrimonio') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('calendar.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('calendar.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={t('calendar.next_deadline')}
          value={nextEvent ? nextEvent.title.substring(0, 30) + (nextEvent.title.length > 30 ? '...' : '') : '—'}
          icon={CalendarCheck}
          iconColor="text-primary"
        />
        <MetricCard
          label={t('calendar.days_until')}
          value={nextEvent ? `${nextEvent.daysUntil}d` : '—'}
          icon={Clock}
          iconColor={nextEvent && nextEvent.daysUntil <= 30 ? 'text-warning' : 'text-info'}
        />
        <MetricCard
          label={t('calendar.upcoming_count')}
          value={String(pending.length)}
          icon={Calculator}
          iconColor="text-purple"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {typeFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilterType(f.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              filterType === f.value
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card glass padding="lg">
          <div className="text-center py-10">
            <Calculator className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{t('calendar.no_events')}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => a.daysUntil - b.daysUntil)
            .map(event => (
              <Card key={event.event_id} className={cn('border-l-4', getCardStyle(event))} padding="md">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {event.is_completed ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <h3 className={cn('text-sm font-semibold truncate', event.is_completed ? 'text-gray-400 line-through' : 'text-gray-900')}>
                        {event.title}
                      </h3>
                      <Badge variant={typeColorMap[event.event_type] || 'default'} size="sm">
                        {t(`calendar.${event.event_type}`)}
                      </Badge>
                      {!event.is_completed && event.daysUntil < 0 && (
                        <Badge variant="error" size="sm">{t('calendar.overdue')}</Badge>
                      )}
                      {!event.is_completed && event.daysUntil >= 0 && event.daysUntil <= 30 && (
                        <Badge variant="warning" size="sm">{t('calendar.due_soon')}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 ml-6">{event.description}</p>
                    {event.nit_digits && (
                      <p className="text-xs text-gray-400 ml-6 mt-0.5">{t('calendar.nit_digits')}: {event.nit_digits}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <p className="text-xs text-gray-500">{t('calendar.due_date')}</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(event.due_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('calendar.status')}</p>
                      <Badge variant={event.is_completed ? 'success' : 'default'} size="sm">
                        {event.is_completed ? t('calendar.completed') : t('calendar.pending')}
                      </Badge>
                    </div>
                    <Button
                      variant={event.is_completed ? 'ghost' : 'secondary'}
                      size="sm"
                      onClick={() => handleToggle(event.event_id)}
                    >
                      {event.is_completed ? t('calendar.mark_pending') : t('calendar.mark_complete')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
