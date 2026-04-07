import { useState, useEffect } from "react";
import { TradeTable } from "@/components/features/journal/TradeTable";
import { TradeFilters } from "@/components/features/journal/TradeFilters";
import { AddTradeModal } from "@/components/features/journal/AddTradeModal";
import { TradeDetailModal } from "@/components/features/journal/TradeDetailModal";
import { ExportModal } from "@/components/features/journal/ExportModal";
import { Plus, Download, Loader2 } from "lucide-react";
import { tradeService } from "@/services/tradeService";

export function JournalPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    timeRange: 'all',
    status: 'all',
    markets: [], // Empty means all markets
    direction: 'all',
    session: 'all',
    hasScreenshot: false,
    hasNotes: false,
  });

  const fetchTrades = async () => {
    setIsLoading(true);
    try {
      const result = await tradeService.getTrades();
      setTrades(result.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleEdit = (trade) => {
    setEditingTrade(trade);
    setIsAddModalOpen(true);
  };

  const handleDuplicate = (trade) => {
    const { id, ...tradeWithoutId } = trade;
    setEditingTrade({ ...tradeWithoutId, date: new Date().toISOString().slice(0, 16) });
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await tradeService.deleteTrade(id);
      fetchTrades();
    } catch (err) {
      console.error("Failed to delete trade", err);
      alert("Алдаа гарлаа. Устгаж чадсангүй.");
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingTrade(null);
    fetchTrades();
  };

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
    
    // Session filter
    if (filters.session !== 'all' && trade.session !== filters.session) return false;

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Арилжааны тэмдэглэл</h1>
          <p className="text-sm text-slate-400 mt-1">Бүх төрлийн зах зээлийн арилжаагаа нэг дор хянах</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => { setEditingTrade(null); setIsAddModalOpen(true); }}
            className="flex-1 sm:flex-none bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(200,240,122,0.15)] hover:shadow-[0_0_20px_rgba(200,240,122,0.25)]"
          >
            <Plus className="w-4 h-4" />
            Шинэ арилжаа
          </button>
        </div>
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
        ) : (
          <TradeTable 
            trades={filteredTrades} 
            onRowClick={(trade) => setSelectedTrade(trade)} 
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        )}
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
    </div>
  );
}
