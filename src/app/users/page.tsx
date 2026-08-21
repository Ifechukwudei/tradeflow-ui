'use client';

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Plus,
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  AlertOctagon,
  UserX,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { UsersService } from '@/lib/services/users.service';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import { User } from '@/types/auth';

const ROLES: ('admin' | 'staff' | 'viewer')[] = ['admin', 'staff', 'viewer'];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'viewer'>('staff');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UsersService.getAll();
      setUsers(data || []);
    } catch (err) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
  }, [currentUser, loadUsers]);

  const handleRoleChange = async (userId: number, newRole: 'admin' | 'staff' | 'viewer') => {
    try {
      await UsersService.updateRole(userId, newRole);
      toast.success('Member role updated!');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeactivate = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user account?')) return;
    try {
      await UsersService.deactivate(userId);
      toast.success('User account deactivated');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to deactivate user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return toast.error('Please fill in all user details');
    }

    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    setSubmitting(true);
    try {
      await UsersService.create({
        name,
        email,
        password,
        role,
      });

      toast.success('New team member added to organization!');
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <AppLayout title="Access Restricted">
        <div className="p-8 max-w-lg mx-auto text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Administrator Privileges Required</h2>
          <p className="text-xs text-slate-400">
            Only organizational Administrators can invite, modify roles, or deactivate team members.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Team & Access Governance"
      subtitle="Manage organizational users, role-based permissions (RBAC), and user access states"
    >
      <div className="space-y-6">
        {/* Header Action */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-white">{users.length}</span> active team members in
              Tenant #{currentUser?.tenant_id}
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="py-3.5 px-6">Member</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Assigned Role</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6">Date Joined</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <span>Loading team members...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-500/20">
                            {u.name ? u.name[0] : 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-white">{u.name}</span>
                            {u.id === currentUser.id && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">{u.email}</td>
                      <td className="py-4 px-6">
                        {u.id === currentUser.id ? (
                          <StatusBadge status={u.role} />
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value as 'admin' | 'staff' | 'viewer')
                            }
                            className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={u.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-400">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {u.id !== currentUser.id && u.is_active && (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs transition-colors"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            <span>Deactivate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Team Member"
        subtitle={`Provision access for user in Tenant #${currentUser?.tenant_id}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Work Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@tradeflow.com"
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Temporary Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Assign Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'staff' | 'viewer')}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="staff">Staff (Create & manage orders, products, invoices)</option>
              <option value="viewer">Viewer (Read-only dashboard and reports)</option>
              <option value="admin">Administrator (Full tenant administration)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow transition-colors"
            >
              {submitting ? 'Creating...' : 'Add Team Member'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
