import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Search, Trash2, Users as UsersIcon } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      // Fallback demo data
      setUsers([
        { id: '1', full_name: 'Demo User', email: 'demo@example.com', role: 'user', created_at: new Date().toISOString() },
        { id: '2', full_name: 'Admin', email: 'admin@nextrapath.com', role: 'admin', created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(userId) {
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
    setConfirmDelete(null);
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating role:', err);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Manage Users</h1>
        <p className="text-slate-500 text-sm">View, search, and manage registered users.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-800">{users.length}</div>
          <div className="text-xs text-slate-500">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-800">{users.filter(u => u.role === 'admin').length}</div>
          <div className="text-xs text-slate-500">Admins</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-800">{users.filter(u => u.role === 'user').length}</div>
          <div className="text-xs text-slate-500">Regular Users</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
        <input type="text" placeholder="Search by name or email..."
          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 shadow-sm"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-left px-6 py-3 font-medium">Role</th>
                  <th className="text-left px-6 py-3 font-medium">Joined</th>
                  <th className="text-right px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{user.full_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${
                        user.role === 'admin' 
                          ? 'bg-red-50 text-red-700 border-red-100' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setConfirmDelete(user.id); setDeleteInput(''); }}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 font-medium">No users found.</div>
        )}
      </div>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Delete User?</h3>
            <p className="text-slate-500 text-sm mb-4">This will permanently remove this user. This action cannot be undone.</p>
            <p className="text-slate-500 text-xs mb-2">Please type <span className="text-red-600 font-semibold">delete</span> to confirm:</p>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-800 placeholder-slate-400 mb-6 text-sm"
              placeholder="type delete..."
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => { setConfirmDelete(null); setDeleteInput(''); }} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">Cancel</button>
              <button
                onClick={() => { handleDelete(confirmDelete); setDeleteInput(''); }}
                disabled={deleteInput.toLowerCase() !== 'delete'}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 disabled:cursor-not-allowed transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
