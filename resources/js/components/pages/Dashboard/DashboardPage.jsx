import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../../../features/dashboard/dashboardSlice';
import AppLayout from '../../templates/AppLayout';
import StatCard from '../../molecules/StatCard';
import DataTable from '../../organisms/DataTable';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((s) => s.dashboard);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  const columns = useMemo(() => [
    { accessorKey: 'exam_title', header: 'Ujian', cell: ({ getValue }) => <span className="font-semibold text-slate-800 dark:text-slate-200">{getValue()}</span> },
    { accessorKey: 'exam_type', header: 'Tipe', cell: ({ getValue }) => <Badge color="blue">{getValue()}</Badge> },
    {
      accessorKey: 'score',
      header: 'Skor',
      cell: ({ getValue }) => {
        const s = getValue();
        if (s === null) return <span className="text-slate-500">—</span>;
        const color = s >= 80 ? 'emerald' : s >= 60 ? 'orange' : 'red';
        return <Badge color={color}>{s}</Badge>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue();
        const map = { ongoing: ['blue', 'Berlangsung'], submitted: ['emerald', 'Selesai'], expired: ['red', 'Kedaluwarsa'] };
        const [color, label] = map[s] ?? ['slate', s];
        return <Badge color={color}>{label}</Badge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Tanggal',
      cell: ({ getValue }) => <span className="text-slate-600 dark:text-slate-400 text-xs">{new Date(getValue()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>,
    },
  ], []);

  const stats = data?.stats;
  const recentSessions = data?.recent_sessions || [];

  return (
    <AppLayout title="Dashboard">
      <div className="flex flex-col gap-6 max-w-6xl">
        {/* Greeting */}
        <div className="bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
            Halo, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Program: <span className="text-blue-400 font-semibold capitalize">{user?.program ?? 'mandiri'}</span>
            {user?.school && ` · ${user.school}`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Sesi CBT"
            value={loading ? '—' : stats?.total_sessions ?? 0}
            icon="📝"
            color="blue"
          />
          <StatCard
            label="Skor Terbaik"
            value={loading ? '—' : stats?.best_score ?? 0}
            icon="🏆"
            color="gold"
          />
          <StatCard
            label="Ujian Selesai"
            value={loading ? '—' : stats?.completed ?? 0}
            icon="✅"
            color="emerald"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/cbt">
            <Button size="md">📝 Mulai Ujian CBT</Button>
          </Link>
          <Link to="/forum">
            <Button variant="ghost" size="md">💬 Tanya Tutor</Button>
          </Link>
        </div>

        {/* History Table */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Riwayat Ujian CBT</h3>
          <DataTable columns={columns} data={recentSessions} loading={loading} pageSize={8} />
        </div>
      </div>
    </AppLayout>
  );
}
