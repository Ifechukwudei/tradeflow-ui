'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Activity, Search, ShieldAlert, Clock, User as UserIcon } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Pagination } from '@/components/ui/Pagination';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PaginationMeta } from '@/types/api';

interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: number | string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: {
          page,
          limit: 20,
          search: search.trim() || undefined,
        },
      });
      // The API could return { data, pagination } or just data array
      if (res.data.data) {
        setLogs(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      } else {
        setLogs(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const getActionColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    if (act.includes('UPDATE') || act.includes('EDIT')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (act.includes('LOGIN')) return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  return (
    <AppLayout
      title="Activity Logs"
      subtitle="System-wide audit trail and security events"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions, entities, users..."
              className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <button type="submit" className="hidden" />
          </form>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />
            <span>Retained for 90 days</span>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">User / Actor</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Entity</th>
                  <th className="py-3.5 px-6">Details / IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <span>Loading audit trail...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Activity className="h-8 w-8 text-slate-600 mb-2" />
                        <p>No activity logs found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <UserIcon className="h-3 w-3 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{log.user_name || 'System / API'}</p>
                            {log.user_email && <p className="text-[10px] text-slate-400">{log.user_email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={\`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider border \${getActionColor(log.action)}\`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-mono text-slate-300">
                          {log.entity_type} {log.entity_id && <span className="text-slate-500">#{log.entity_id}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 max-w-xs truncate">
                        {log.details ? (
                          <span className="font-mono text-[10px]">{JSON.stringify(log.details)}</span>
                        ) : log.ip_address ? (
                          <span className="font-mono text-[10px]">IP: {log.ip_address}</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
        </div>
      </div>
    </AppLayout>
  );
}
