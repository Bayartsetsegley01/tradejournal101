import { useEffect, useState, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, Trash2, UserCheck, UserX, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { getUsers, updateUserStatus, deleteUser } from "@/services/adminService";

export function AdminUsers() {
  const [data, setData] = useState({ users: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getUsers({ page, limit: 20, search: search || undefined, status: status || undefined, sort, order })
      .then(d => { setData(d); setSelected(new Set()); })
      .catch(e => setError(e.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, search, status, sort, order]);

  useEffect(() => { load(); }, [load]);

  const toggleSort = (field) => {
    if (sort === field) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setOrder('desc'); }
    setPage(1);
  };

  const handleStatusToggle = async (user) => {
    await updateUserStatus(user.id, !user.is_active);
    load();
  };

  const handleDelete = async (id) => {
    await deleteUser(id);
    setConfirm(null);
    load();
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === data.users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.users.map(u => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    await Promise.all([...selected].map(id => deleteUser(id)));
    setBulkConfirm(null);
    setSelected(new Set());
    load();
  };

  const handleBulkStatus = async (active) => {
    await Promise.all([...selected].map(id => updateUserStatus(id, active)));
    setSelected(new Set());
    load();
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Auth', 'Trades', 'Status', 'Created', 'Last Login'];
    const rows = data.users.map(u => [
      u.name || '',
      u.email,
      u.auth_provider === 'google' ? 'Google' : u.auth_provider === 'both' ? 'Email+Google' : 'Email',
      u.trade_count,
      u.is_active ? 'Active' : 'Inactive',
      u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
      u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }) => {
    if (sort !== field) return null;
    return order === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">{data.total} total users</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl text-sm font-medium transition-colors border border-accent/20"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" placeholder="Search by name or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50"
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-accent/50">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl animate-in fade-in duration-200">
          <span className="text-sm font-medium text-accent">{selected.size} selected</span>
          <button onClick={() => handleBulkStatus(true)} className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Activate
          </button>
          <button onClick={() => handleBulkStatus(false)} className="text-xs px-3 py-1.5 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-1.5">
            <UserX className="w-3.5 h-3.5" /> Deactivate
          </button>
          <button onClick={() => setBulkConfirm(true)} className="text-xs px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400">
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={data.users.length > 0 && selected.size === data.users.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-600 bg-slate-800 accent-accent cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                  User <SortIcon field="name" />
                </th>
                <th className="text-left px-4 py-3">Auth</th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('trades')}>
                  Trades <SortIcon field="trades" />
                </th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('created_at')}>
                  Joined <SortIcon field="created_at" />
                </th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('last_login_at')}>
                  Last Login <SortIcon field="last_login_at" />
                </th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">Loading...</td></tr>
              ) : data.users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">No users found</td></tr>
              ) : data.users.map(u => (
                <tr key={u.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${selected.has(u.id) ? 'bg-accent/5' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      className="rounded border-slate-600 bg-slate-800 accent-accent cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                        {(u.name || u.email)?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.name || '—'}</p>
                        <p className="text-slate-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400">
                      {u.auth_provider === 'google' ? 'Google' : u.auth_provider === 'both' ? 'Email+Google' : 'Email'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium">{u.trade_count}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${u.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStatusToggle(u)} title={u.is_active ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setConfirm(u.id)} title="Delete"
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">{page} / {data.pages} pages</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single delete confirm */}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-2">Delete User</h3>
            <p className="text-slate-400 text-sm mb-5">This action cannot be undone. All trade data for this user will be deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirm)} className="flex-1 py-2 rounded-xl text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm */}
      {bulkConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-2">Delete {selected.size} Users</h3>
            <p className="text-slate-400 text-sm mb-5">This will permanently delete {selected.size} users and all their trade data.</p>
            <div className="flex gap-3">
              <button onClick={() => setBulkConfirm(null)} className="flex-1 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleBulkDelete} className="flex-1 py-2 rounded-xl text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors">Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
