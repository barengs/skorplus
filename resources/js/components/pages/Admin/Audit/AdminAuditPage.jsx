import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '../../../templates/AppLayout';
import Button from '../../../atoms/Button';
import Badge from '../../../atoms/Badge';
import Input from '../../../atoms/Input';
import StatCard from '../../../molecules/StatCard';
import DataTable from '../../../organisms/DataTable/DataTable';
import api from '../../../../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AdminAuditPage() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit'

  // ==========================================
  // AUDIT LOGS STATE
  // ==========================================
  const [logs, setLogs] = useState([]);
  const [auditStats, setAuditStats] = useState(null);
  const [logsLoading, setLogsLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [searchLog, setSearchLog] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Log Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);


  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const params = {};
      if (moduleFilter) params.module = moduleFilter;
      if (actionFilter) params.action = actionFilter;
      if (searchLog) params.search = searchLog;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const [logsRes, statsRes] = await Promise.all([
        api.get('/admin/audit-logs', { params }),
        api.get('/admin/audit-logs/stats'),
      ]);

      setLogs(logsRes.data.data || []);
      setAuditStats(statsRes.data);
    } catch {
      toast.error('Gagal memuat log audit');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Tab 1 Columns (Audit Logs)
  const auditColumns = useMemo(() => [
    {
      accessorKey: 'created_at',
      header: 'Waktu',
      cell: (info) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {new Date(info.getValue()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div className="text-slate-400 font-mono">
            {new Date(info.getValue()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'user_name',
      header: 'Pengguna',
      cell: (info) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{info.getValue() || 'Sistem'}</div>
          <div className="text-xs">
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {info.row.original.user_role || 'system'}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Aksi & Modul',
      cell: (info) => {
        const act = info.getValue();
        const mod = info.row.original.module;
        let color = 'blue';
        if (act.includes('LOGIN')) color = 'emerald';
        if (act.includes('SUBMIT')) color = 'purple';
        if (act.includes('DELETE')) color = 'rose';
        if (act.includes('IMPORT') || act.includes('EXPORT')) color = 'amber';

        return (
          <div className="space-y-1">
            <Badge color={color}>{act}</Badge>
            <div className="text-[11px] text-slate-400 font-mono">modul: {mod}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Deskripsi Aktivitas',
      cell: (info) => (
        <div className="text-sm text-slate-700 dark:text-slate-300 max-w-md line-clamp-2">
          {info.getValue()}
        </div>
      ),
    },
    {
      accessorKey: 'ip_address',
      header: 'IP Address',
      cell: (info) => (
        <span className="font-mono text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          {info.getValue() || '127.0.0.1'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Detail',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(row.original)}>
          Detail
        </Button>
      ),
    },
  ], []);


  return (
    <AppLayout title="Audit & Laporan Sistem">
      <div className="w-full pb-16 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-base shadow-md shadow-blue-500/20">
                <FontAwesomeIcon icon={['fas', 'shield-halved']} />
              </span>
              Audit & Log Aktivitas Sistem
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Pantau rekam jejak aktivitas pengguna & log keamanan sistem.
            </p>
          </div>
          <a href="/admin/reports">
            <Button variant="outline" className="text-purple-600 border-purple-500 hover:bg-purple-50 dark:text-purple-400">
              <FontAwesomeIcon icon={['fas', 'chart-pie']} className="mr-1.5" /> Buka Dashboard Laporan & Statistik
            </Button>
          </a>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={['fas', 'list-check']} />
            Log Aktivitas (Audit)
          </button>
        </div>

        {/* AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Rekam Audit"
                value={auditStats?.total_logs ?? 0}
                icon={<FontAwesomeIcon icon={['fas', 'database']} className="text-blue-500" />}
                color="blue"
              />
              <StatCard
                label="Aktivitas Hari Ini"
                value={auditStats?.today_logs ?? 0}
                icon={<FontAwesomeIcon icon={['fas', 'clock']} className="text-emerald-500" />}
                color="emerald"
              />
              <StatCard
                label="Modul Aktif"
                value={auditStats?.module_stats?.length ?? 0}
                icon={<FontAwesomeIcon icon={['fas', 'cubes']} className="text-purple-500" />}
                color="purple"
              />
              <StatCard
                label="Pengguna Teraktif"
                value={auditStats?.recent_active_users?.[0]?.user_name ?? '—'}
                icon={<FontAwesomeIcon icon={['fas', 'user-check']} className="text-amber-500" />}
                color="gold"
              />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid sm:grid-cols-2 md:grid-cols-5 gap-3">
              <Input
                placeholder="Cari aksi, pengguna..."
                value={searchLog}
                onChange={e => setSearchLog(e.target.value)}
              />
              <select
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="">Semua Modul</option>
                <option value="auth">Autentikasi (Auth)</option>
                <option value="school">Mitra Sekolah</option>
                <option value="elearning">E-Learning</option>
                <option value="cbt">Ujian CBT</option>
                <option value="system">Sistem</option>
              </select>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                title="Dari tanggal"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                title="Sampai tanggal"
              />
              <Button onClick={fetchAuditLogs}>
                <FontAwesomeIcon icon={['fas', 'filter']} className="mr-1.5" /> Terapkan Filter
              </Button>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <DataTable columns={auditColumns} data={logs} loading={logsLoading} />
            </div>
          </div>
        )}

        {/* Selected Log Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                  <FontAwesomeIcon icon={['fas', 'circle-info']} className="text-blue-500" />
                  Rincian Log Audit #{selectedLog.id}
                </h3>
                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Pengguna:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedLog.user_name} ({selectedLog.user_role})
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Aksi & Modul:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedLog.action} &bull; {selectedLog.module}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Deskripsi:</span>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedLog.description}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">IP Address:</span>
                    <span className="font-mono">{selectedLog.ip_address || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Waktu:</span>
                    <span>{new Date(selectedLog.created_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <span className="text-slate-500 text-xs block mb-1">Metadata Tambahan:</span>
                    <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 mt-5 flex justify-end">
                <Button onClick={() => setSelectedLog(null)}>Tutup</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
