'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, FileDown, FileSpreadsheet, FileText, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import type { Institution, Account, ImportHistoryEntry, ImportEntityType } from '@/types';
import api from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
import { cn, formatDateShort } from '@/lib/formatters';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';

type UploadTab = 'spreadsheet' | 'pdf';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  success: 'success',
  partial: 'warning',
  error: 'error',
};

export default function ImportPage() {
  const { t } = useLocale();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);
  const [importType, setImportType] = useState<ImportEntityType>('transactions');
  const [uploadTab, setUploadTab] = useState<UploadTab>('spreadsheet');
  const [pdfInstitution, setPdfInstitution] = useState('');
  const [pdfAccountId, setPdfAccountId] = useState('');
  const [pdfPeriod, setPdfPeriod] = useState('2026-01');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [parsedPositions, setParsedPositions] = useState<Record<string, unknown>[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<Record<string, unknown>[]>([]);
  const [isCombined, setIsCombined] = useState(false);
  const [statementMeta, setStatementMeta] = useState<Record<string, unknown> | null>(null);
  const [parseErrors, setParseErrors] = useState<ValidationError[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    status: 'success' | 'partial' | 'error';
    successCount: number;
    rowCount: number;
    skippedCount?: number;
    errors?: string[];
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch import history from API with timeout
  const loadHistory = useCallback(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch('/api/import/history', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('Failed to load import history:', err);
      })
      .finally(() => clearTimeout(timeout));
  }, []);

  useEffect(() => {
    loadHistory();
    api.getInstitutions().then(setInstitutions);
    api.getAccounts().then(setAccounts);
  }, [loadHistory]);

  // Reset state when switching tabs
  useEffect(() => {
    clearPreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadTab]);

  // Auto-trigger parse when file + institution + account are ready (PDF tab)
  useEffect(() => {
    if (uploadTab === 'pdf' && selectedFile && pdfInstitution && pdfAccountId && !isParsing && !importResult) {
      triggerParse(selectedFile);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfInstitution, pdfAccountId]);

  function clearPreview() {
    setSelectedFile(null);
    setParsedRows([]);
    setParsedPositions([]);
    setParsedTransactions([]);
    setIsCombined(false);
    setStatementMeta(null);
    setParseErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Core parse function — sends file to API
  async function triggerParse(file: File) {
    setParsedRows([]);
    setParsedPositions([]);
    setParsedTransactions([]);
    setIsCombined(false);
    setParseErrors([]);
    setImportResult(null);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', importType);
      formData.append('tab', uploadTab);
      if (uploadTab === 'pdf') {
        formData.append('institution', pdfInstitution);
        formData.append('period', pdfPeriod);
        formData.append('accountId', pdfAccountId);
      }

      const res = await fetch('/api/import/parse', { method: 'POST', body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();

      if (data.success) {
        if (data.combined) {
          // Combined result from PDF statement (positions + transactions)
          const posRows = data.positions?.rows || [];
          const txRows = data.transactions?.rows || [];
          setParsedPositions(posRows);
          setParsedTransactions(txRows);
          setIsCombined(true);
          // Store statement metadata for valuation snapshots on commit
          if (data.statementMeta) setStatementMeta(data.statementMeta);
          // Set parsedRows to combined for total count display
          setParsedRows([...posRows, ...txRows]);
          // Merge errors
          const allErrors = [
            ...(data.positions?.errors || []),
            ...(data.transactions?.errors || []),
          ];
          setParseErrors(allErrors);
        } else {
          // Flat result from spreadsheet
          setParsedRows(data.rows || []);
          setParseErrors(data.errors || []);
        }
      } else {
        setParseErrors([{ row: -1, field: '', message: data.error || 'Failed to parse file' }]);
      }
    } catch (err) {
      setParseErrors([{ row: -1, field: '', message: `Parse error: ${(err as Error).message}` }]);
    } finally {
      setIsParsing(false);
    }
  }

  // File selection handler — for spreadsheet tab, parse immediately; for PDF, just set file
  async function handleFileSelected(file: File) {
    clearPreview();
    setSelectedFile(file);

    if (uploadTab === 'spreadsheet') {
      // Spreadsheet: parse immediately
      await triggerParse(file);
    } else {
      // PDF: parse only if institution + account are already set
      if (pdfInstitution && pdfAccountId) {
        await triggerParse(file);
      }
      // Otherwise, useEffect will trigger when user selects institution/account
    }
  }

  // Import (commit) handler
  async function handleImport() {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      // Build request body based on combined vs flat mode
      const body = isCombined
        ? {
            entityType: 'skandia_statement',
            positions: parsedPositions,
            transactions: parsedTransactions,
            filename: selectedFile?.name || 'unknown',
            statementMeta,
          }
        : {
            entityType: uploadTab === 'pdf' ? 'transactions' : importType,
            rows: parsedRows,
            filename: selectedFile?.name || 'unknown',
          };

      const res = await fetch('/api/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();

      if (data.success) {
        setImportResult({
          status: data.status,
          successCount: data.successCount,
          rowCount: data.rowCount,
          skippedCount: data.skippedCount || 0,
          errors: data.errors,
        });
        loadHistory();
      } else {
        setImportResult({
          status: 'error',
          successCount: 0,
          rowCount: parsedRows.length,
          errors: [data.error || 'Import failed'],
        });
      }
    } catch (err) {
      setImportResult({
        status: 'error',
        successCount: 0,
        rowCount: parsedRows.length,
        errors: [`Import error: ${(err as Error).message}`],
      });
    } finally {
      setIsImporting(false);
    }
  }

  // Drag and drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  }
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  }
  function handleDropZoneClick() {
    fileInputRef.current?.click();
  }

  // Template download
  function downloadTemplate(type: ImportEntityType) {
    window.open(`/api/import/templates?type=${type}`, '_blank');
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const typeOptions: { value: ImportEntityType; label: string }[] = [
    { value: 'transactions', label: t('import.transactions') },
    { value: 'positions', label: t('import.positions') },
    { value: 'accounts', label: t('import.accounts') },
  ];

  // Dynamic preview columns helper
  function makeColumns(data: Record<string, unknown>[]) {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(k => k !== 'is_active' && k !== 'account_id').map(key => ({
      key: key as keyof Record<string, unknown>,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      render: (v: unknown) => {
        if (v === null || v === undefined) return <span className="text-gray-300">—</span>;
        if (typeof v === 'number') return v.toLocaleString();
        return String(v);
      },
    }));
  }

  // Columns for flat (spreadsheet) mode
  const previewColumns = makeColumns(parsedRows);
  // Columns for combined mode
  const positionColumns = makeColumns(parsedPositions);
  const transactionColumns = makeColumns(parsedTransactions);

  // Check for blocking validation errors
  const hasBlockingErrors = parseErrors.some(e => e.row >= 0);

  const historyCols = [
    { key: 'date' as keyof ImportHistoryEntry, label: t('import.date'), sortable: true, width: '110px', render: (v: unknown) => formatDateShort(v as string) },
    { key: 'filename' as keyof ImportHistoryEntry, label: t('import.file') },
    { key: 'entity_type' as keyof ImportHistoryEntry, label: t('import.type'), render: (v: unknown) => <Badge variant="default" size="sm">{v === 'skandia_statement' ? t('import.skandia_statement') : v as string}</Badge> },
    { key: 'row_count' as keyof ImportHistoryEntry, label: t('import.rows'), align: 'right' as const, render: (v: unknown, row: ImportHistoryEntry) => `${row.success_count}/${v}` },
    { key: 'status' as keyof ImportHistoryEntry, label: t('import.status'), render: (v: unknown) => <Badge variant={statusColors[v as string] || 'default'} size="sm">{t(`import.${v}`)}</Badge> },
  ];

  const uploadTabs: { value: UploadTab; label: string; icon: typeof FileSpreadsheet }[] = [
    { value: 'spreadsheet', label: t('import.tab_spreadsheet'), icon: FileSpreadsheet },
    { value: 'pdf', label: t('import.tab_pdf'), icon: FileText },
  ];

  const acceptTypes = uploadTab === 'pdf' ? '.pdf' : '.csv,.xlsx,.xls';

  // Filter accounts by selected institution for the PDF tab
  const filteredAccounts = accounts.filter(a => a.institution === pdfInstitution && a.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('import.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('import.subtitle')}</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Upload */}
        <div className="space-y-4">
          <Card glass padding="lg">
            {/* Upload mode tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
              {uploadTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setUploadTab(tab.value)}
                    className={cn(
                      'flex items-center gap-1.5 flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors',
                      uploadTab === tab.value
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {uploadTab === 'spreadsheet' ? (
              <>
                {/* Drop zone */}
                <div
                  onClick={handleDropZoneClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                    isDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-primary'
                  )}
                >
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700">{t('import.upload_area_title')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('import.upload_area_desc')}</p>
                  <p className="text-xs text-gray-400 mt-2">{t('import.supported_formats')}</p>
                </div>

                {/* Selected file info */}
                {selectedFile && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800 truncate">{selectedFile.name}</span>
                    <span className="text-xs text-blue-500 ml-auto">{formatFileSize(selectedFile.size)}</span>
                  </div>
                )}

                {/* Import type selector */}
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('import.select_type')}</p>
                  <div className="flex gap-2">
                    {typeOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setImportType(opt.value)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                          importType === opt.value
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template downloads */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {typeOptions.map(opt => (
                    <Button
                      key={opt.value}
                      variant="secondary"
                      size="sm"
                      icon={FileDown}
                      onClick={() => downloadTemplate(opt.value)}
                    >
                      {t('import.download_template')} ({opt.label})
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* PDF Drop zone */}
                <div
                  onClick={handleDropZoneClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                    isDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-primary'
                  )}
                >
                  <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700">{t('import.upload_area_title')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('import.pdf_upload_desc')}</p>
                  <p className="text-xs text-gray-400 mt-2">{t('import.pdf_supported_formats')}</p>
                </div>

                {/* Selected file info */}
                {selectedFile && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800 truncate">{selectedFile.name}</span>
                    <span className="text-xs text-blue-500 ml-auto">{formatFileSize(selectedFile.size)}</span>
                  </div>
                )}

                {/* Institution + Account + Period selectors */}
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('import.select_institution')}</p>
                      <select
                        value={pdfInstitution}
                        onChange={e => { setPdfInstitution(e.target.value); setPdfAccountId(''); }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value="">—</option>
                        {institutions.filter(i => i.is_active).map(inst => (
                          <option key={inst.institution_id} value={inst.name}>{inst.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('import.select_account')}</p>
                      <select
                        value={pdfAccountId}
                        onChange={e => setPdfAccountId(e.target.value)}
                        disabled={!pdfInstitution}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">—</option>
                        {filteredAccounts.map(acc => (
                          <option key={acc.account_id} value={acc.account_id}>
                            {acc.name || acc.account_id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('import.statement_period')}</p>
                    <input
                      type="month"
                      value={pdfPeriod}
                      onChange={e => setPdfPeriod(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Preview */}
        <div className="space-y-4">
          <Card glass padding="lg">
            <div className="flex items-center gap-2 mb-3">
              {uploadTab === 'pdf'
                ? <FileText className="w-4 h-4 text-primary" />
                : <FileSpreadsheet className="w-4 h-4 text-primary" />
              }
              <h3 className="text-sm font-semibold text-gray-900">{t('import.preview')}</h3>
              {parsedRows.length > 0 && (
                <span className="text-xs text-gray-500 ml-auto">
                  {parsedRows.length} {t('import.rows_parsed')}
                </span>
              )}
            </div>

            {/* Parsing spinner */}
            {isParsing && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
                <span className="text-sm text-gray-600">{t('import.parsing')}</span>
              </div>
            )}

            {/* Parse errors (file-level, shown even without rows) */}
            {!isParsing && parsedRows.length === 0 && parseErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-800">Error</span>
                </div>
                <ul className="space-y-1">
                  {parseErrors.map((err, i) => (
                    <li key={i} className="text-xs text-red-700">{err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty state */}
            {!isParsing && parsedRows.length === 0 && parseErrors.length === 0 && !importResult && (
              <div className="text-center py-12">
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">{t('import.no_preview')}</p>
              </div>
            )}

            {/* Preview table(s) */}
            {!isParsing && parsedRows.length > 0 && (
              <>
                {isCombined ? (
                  <div className="space-y-4">
                    {/* Positions preview */}
                    {parsedPositions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          {t('import.positions_preview')} ({parsedPositions.length})
                        </h4>
                        <div className="overflow-x-auto max-h-48 overflow-y-auto">
                          <DataTable
                            columns={positionColumns}
                            data={parsedPositions as Record<string, unknown>[]}
                            emptyMessage={t('table.no_data')}
                          />
                        </div>
                      </div>
                    )}
                    {/* Transactions preview */}
                    {parsedTransactions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          {t('import.transactions_preview')} ({parsedTransactions.length})
                        </h4>
                        <div className="overflow-x-auto max-h-48 overflow-y-auto">
                          <DataTable
                            columns={transactionColumns}
                            data={parsedTransactions as Record<string, unknown>[]}
                            emptyMessage={t('table.no_data')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <DataTable
                      columns={previewColumns}
                      data={parsedRows as Record<string, unknown>[]}
                      emptyMessage={t('table.no_data')}
                    />
                  </div>
                )}

                {/* Validation errors */}
                {parseErrors.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">{t('import.validation_errors')} ({parseErrors.length})</span>
                    </div>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                      {parseErrors.slice(0, 10).map((err, i) => (
                        <li key={i} className="text-xs text-amber-700">
                          {err.row >= 0 ? `Row ${err.row + 1}` : 'File'}: {err.field ? `[${err.field}] ` : ''}{err.message}
                        </li>
                      ))}
                      {parseErrors.length > 10 && (
                        <li className="text-xs text-amber-600 italic">...and {parseErrors.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Import result */}
                {importResult && (
                  <div className={cn(
                    'mt-3 p-3 rounded-lg border',
                    importResult.status === 'success' ? 'bg-green-50 border-green-200' :
                    importResult.status === 'partial' ? 'bg-amber-50 border-amber-200' :
                    'bg-red-50 border-red-200'
                  )}>
                    <div className="flex items-center gap-1.5">
                      {importResult.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : importResult.status === 'partial' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={cn(
                        'text-xs font-semibold',
                        importResult.status === 'success' ? 'text-green-800' :
                        importResult.status === 'partial' ? 'text-amber-800' :
                        'text-red-800'
                      )}>
                        {importResult.status === 'success'
                          ? t('import.import_success').replace('{count}', String(importResult.successCount))
                          : importResult.status === 'partial'
                            ? t('import.import_partial')
                                .replace('{success}', String(importResult.successCount))
                                .replace('{total}', String(importResult.rowCount))
                                .replace('{errors}', String(importResult.rowCount - importResult.successCount - (importResult.skippedCount || 0)))
                            : t('import.import_error')
                        }
                        {importResult.skippedCount && importResult.skippedCount > 0 ? (
                          <span className="ml-1 font-normal">
                            ({t('import.skipped_duplicates').replace('{count}', String(importResult.skippedCount))})
                          </span>
                        ) : null}
                      </span>
                    </div>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {importResult.errors.slice(0, 5).map((e, i) => (
                          <li key={i} className="text-xs text-red-600">{e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={clearPreview}>
                    {t('import.clear_preview')}
                  </Button>
                  <Button
                    variant="primary"
                    icon={isImporting ? Loader2 : Upload}
                    onClick={handleImport}
                    disabled={isImporting || hasBlockingErrors || parsedRows.length === 0 || !!importResult}
                  >
                    {isImporting
                      ? t('import.importing')
                      : `${t('import.import_button')} (${parsedRows.length})`
                    }
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Import History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('import.import_history')}</h2>
        <Card>
          <DataTable columns={historyCols} data={history} emptyMessage={t('import.no_history')} />
        </Card>
      </div>
    </div>
  );
}
