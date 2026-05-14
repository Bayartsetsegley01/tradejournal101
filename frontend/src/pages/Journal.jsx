import { useState, useEffect } from "react";
import { TradeTable } from "@/components/features/journal/TradeTable";
import { TradeFilters } from "@/components/features/journal/TradeFilters";
import { AddTradeModal } from "@/components/features/journal/AddTradeModal";
import { TradeDetailModal } from "@/components/features/journal/TradeDetailModal";
import { ExportModal } from "@/components/features/journal/ExportModal";
import { ImportModal } from "@/components/features/journal/ImportModal";
import { TimeFilter } from "@/components/features/analytics/TimeFilter";
import { Plus, Download, Loader2, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { SESSIONS } from "@/lib/constants";
import { useLang } from "@/contexts/LanguageContext";
import { useTrades } from "@/contexts/TradesContext";
import { tradeService } from "@/services/tradeService";

const PAGE_SIZE = 10;

export function JournalPage() {
  const { t } = useLang();
  const { trades, loading: isLoading, invalidate, applyUpdate, applyRemove } = useTrades();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  const [error] = useState(null);
  const [page, setPage] = useState(1);
  
  
  // Filters state — init timeRange from localStorage (shared with Analytics)
  const [filters, setFilters] = useState(() => ({
    search: '',
    timeRange: localStorage.getItem('analytics_time_range') || 'all',
    status: 'all',
    markets: [],
    direction: 'all',
    session: 'all',
    hasScreenshot: false,
    hasNotes: false,
  }));
  const [customRange, setCustomRange] = useState(() => {
    try { return JSON.parse(localStorage.getItem('analytics_custom_range')); } catch { return null; }
  });

  // Keep localStorage in sync when timeRange changes
  useEffect(() => {
    localStorage.setItem('analytics_time_range', filters.timeRange);
  }, [filters.timeRange]);

  
  const handleEdit = (trade) => {
    setEditingTrade(trade);
    setIsAddModalOpen(true);
  };

  const handleDuplicate = (trade) => {
    const { id, ...tradeWithoutId } = trade;
    setIsAddModalOpen(false);
    setTimeout(() => {
      setEditingTrade({ ...tradeWithoutId, date: new Date().toISOString().slice(0, 16) });
      setIsAddModalOpen(true);
    }, 50);
  };

  const handleDelete = async (id) => {
    applyRemove(id);
    try {
      await tradeService.deleteTrade(id);
      invalidate();
    } catch (err) {
      console.error("Failed to delete trade", err);
      invalidate(); // revert by refreshing
      alert("Алдаа гарлаа. Устгаж чадсангүй.");
    }
  };

  const handleMediaUpdate = (id, mediaUrls) => {
    applyUpdate(id, { media_urls: mediaUrls });
  };

  const handlePatch = async (id, changes) => {
    const trade = trades.find(t => t.id === id);
    if (!trade) return;
    applyUpdate(id, changes);
    try {
      await tradeService.updateTrade(id, { ...trade, ...changes });
      invalidate();
    } catch (err) {
      applyUpdate(id, trade); // revert
      throw err;
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingTrade(null);
    invalidate();
  };

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filters]);

  // Filter trades based on search and other filters
  const filteredTrades = trades.filter(trade => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const symbolMatch = trade.symbol?.toLowerCase().includes(searchLower);
      const notesMatch = 
        trade.notes?.toLowerCase().includes(searchLower) || 
        trade.whyEntered?.toLowerCase().includes(searchLower) || 
        trade.whatHappened?.toLowerCase().includes(searchLower) ||
        trade.lessonLearned?.toLowerCase().includes(searchLower);
      const tagsMatch = 
        trade.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        trade.positiveTags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        trade.mistakeTags?.some(tag => tag.toLowerCase().includes(searchLower));
      if (!symbolMatch && !notesMatch && !tagsMatch) return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && trade.status !== filters.status) return false;
    
    // Direction filter
    if (filters.direction !== 'all' && trade.direction !== filters.direction) return false;
    
    // Session filter (case-insensitive, match by id or label)
    if (filters.session !== 'all') {
      const sess = SESSIONS.find(s => s.id === filters.session);
      const ts = (trade.session || '').toLowerCase();
      if (ts !== filters.session.toLowerCase() && (!sess || ts !== sess.label.toLowerCase())) return false;
    }

    // Markets filter
    if (filters.markets.length > 0 && !filters.markets.includes(trade.market_type)) return false;

    // TimeRange filter
    if (filters.timeRange !== 'all') {
      const tradeDate = new Date(trade.entry_date || trade.date);
      const now = new Date();
      if (filters.timeRange === 'today') {
        if (tradeDate.toDateString() !== now.toDateString()) return false;
      } else if (filters.timeRange === '7d') {
        if (now - tradeDate > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (filters.timeRange === '1m') {
        if (now - tradeDate > 30 * 24 * 60 * 60 * 1000) return false;
      } else if (filters.timeRange === '3m') {
        if (now - tradeDate > 90 * 24 * 60 * 60 * 1000) return false;
      } else if (filters.timeRange === '6m') {
        if (now - tradeDate > 180 * 24 * 60 * 60 * 1000) return false;
      } else if (filters.timeRange === '1y') {
        if (now - tradeDate > 365 * 24 * 60 * 60 * 1000) return false;
      } else if (filters.timeRange === 'custom' && customRange?.start && customRange?.end) {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59, 999);
        if (tradeDate < start || tradeDate > end) return false;
      }
    }

    // Screenshot filter
    if (filters.hasScreenshot && !trade.screenshot_url) return false;
    
    // Notes filter
    if (filters.hasNotes && (!trade.notes && !trade.whyEntered && !trade.whatHappened)) return false;

    return true;
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('journalTitle')}</h1>
            <p className="text-sm text-slate-400 mt-1">{t('journalSubtitle')}</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <Download className="w-4 h-4" />
              {t('import')}
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <Upload className="w-4 h-4" />
              {t('export')}
            </button>
            <button
              onClick={() => { setEditingTrade(null); setIsAddModalOpen(true); }}
              className="flex-1 sm:flex-none bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(200,240,122,0.15)] hover:shadow-[0_0_20px_rgba(200,240,122,0.25)]"
            >
              <Plus className="w-4 h-4" />
              {t('newTrade')}
            </button>
          </div>
        </div>

        {/* Time Filter — shared with Analytics */}
        <TimeFilter
          value={filters.timeRange}
          onChange={(v) => setFilters(f => ({ ...f, timeRange: v }))}
          customRange={customRange}
          onCustomRangeChange={(r) => {
            setCustomRange(r);
            if (r) localStorage.setItem('analytics_custom_range', JSON.stringify(r));
          }}
        />
      </div>

      {/* Filters */}
      <TradeFilters filters={filters} setFilters={setFilters} />

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-12 text-red-400">
            Алдаа гарлаа: {error}
          </div>
        ) : (() => {
          const totalPages = Math.ceil(filteredTrades.length / PAGE_SIZE);
          const safePage = Math.min(page, Math.max(1, totalPages));
          const pagedTrades = filteredTrades.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

          // Page numbers: show up to 7 slots with ellipsis
          const getPages = () => {
            if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
            const pages = [];
            if (safePage > 3) { pages.push(1); if (safePage > 4) pages.push('…'); }
            for (let i = Math.max(1, safePage - 2); i <= Math.min(totalPages, safePage + 2); i++) pages.push(i);
            if (safePage < totalPages - 2) { if (safePage < totalPages - 3) pages.push('…'); pages.push(totalPages); }
            return pages;
          };

          return (
            <>
              <TradeTable
                trades={pagedTrades}
                onRowClick={(trade) => setSelectedTrade(trade)}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onPatch={handlePatch}
                onMediaUpdate={handleMediaUpdate}
              />

              {/* Pagination */}
              {filteredTrades.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 shrink-0">
                  <span className="text-xs text-slate-500">
                    Нийт <span className="text-slate-400 font-medium">{filteredTrades.length}</span> арилжааны{' '}
                    <span className="text-slate-400">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredTrades.length)}</span> харагдаж байна
                  </span>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {getPages().map((p, i) =>
                        p === '…' ? (
                          <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-slate-600 text-sm">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              p === safePage
                                ? 'bg-accent text-slate-950 font-bold shadow-[0_0_12px_rgba(200,240,122,0.3)]'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddTradeModal 
          isOpen={isAddModalOpen} 
          onClose={handleCloseAddModal} 
          initialData={editingTrade}
        />
      )}
      
      {selectedTrade && (
        <TradeDetailModal 
          trade={selectedTrade} 
          onClose={() => setSelectedTrade(null)} 
          onEdit={() => { setSelectedTrade(null); handleEdit(selectedTrade); }}
          onDuplicate={() => { setSelectedTrade(null); handleDuplicate(selectedTrade); }}
          onDelete={() => { handleDelete(selectedTrade.id); setSelectedTrade(null); }}
        />
      )}

      {isExportModalOpen && (
        <ExportModal onClose={() => setIsExportModalOpen(false)} trades={filteredTrades} />
      )}

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => { setIsImportModalOpen(false); invalidate(); }}
        onImportComplete={invalidate} 
      />
    </div>
  );
}
