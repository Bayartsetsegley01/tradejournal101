import { useEffect, useState, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, Trash2, UserCheck, UserX, ChevronLeft, ChevronRight } from "lucide-react";
import { getUsers, updateUserStatus, deleteUser } from "@/services/adminService";

const SORT_FIELDS = [
  { key: "created_at", label: "Бүртгэсэн огноо" },
  { key: "name", label: "Нэр" },
  { key: "last_login_at", label: "Сүүлийн нэвтрэлт" },
  { key: "trades", label: "Trade тоо" },
];

export function AdminUsers() {
  const [data, setData] = useState({ users: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getUsers({ page, limit: 20, search: search || undefined, status: status || undefined, sort, order })
      .then(setData)
      .catch(console.error)
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

  const SortIcon = ({ field }) => {
    if (sort !== field) return null;
    return order === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Хэрэглэгчид</h1>
        <p className="text-slate-400 text-sm mt-1">Нийт {data.total} хэрэглэгч</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" placeholder="Нэр, имэйлээр хайх..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50"
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-accent/50">
          <option value="">Бүх статус</option>
          <option value="active">Идэвхтэй</option>
          <option value="inactive">Идэвхгүй</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                  Хэрэглэгч <SortIcon field="name" />
                </th>
                <th className="text-left px-4 py-3">Нэвтрэлт</th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('trades')}>
                  Trade <SortIcon field="trades" />
                </th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('created_at')}>
                  Бүртгэсэн <SortIcon field="created_at" />
                </th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('last_login_at')}>
                  Сүүлийн нэвтрэлт <SortIcon field="last_login_at" />
                </th>
                <th className="text-left px-4 py-3">Статус</th>
                <th className="text-left px-4 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Уншиж байна...</td></tr>
              ) : data.users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Хэрэглэгч олдсонгүй</td></tr>
              ) : data.users.map(u => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
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
                  <td className="px-4 py-3 text-slate-300">{u.trade_count}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString('mn-MN') : '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('mn-MN') : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${u.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {u.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStatusToggle(u)} title={u.is_active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setConfirm(u.id)} title="Устгах"
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

        {/* Pagination */}
        {data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">{page} / {data.pages} хуудас</span>
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

      {/* Delete confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-2">Хэрэглэгч устгах</h3>
            <p className="text-slate-400 text-sm mb-5">Энэ үйлдлийг буцааж болохгүй. Уг хэрэглэгчийн бүх trade мэдээлэл устана.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
                Болих
              </button>
              <button onClick={() => handleDelete(confirm)}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors">
                Устгах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
