import { X, FileSpreadsheet, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export function ExportModal({ onClose, trades = [] }) {
  const handleExportCSV = () => {
    if (!trades || trades.length === 0) {
      alert("No trades to export.");
      return;
    }

    const headers = ["Date", "Symbol", "Direction", "Status", "Entry", "Exit", "Stop Loss", "Take Profit", "Quantity", "PnL", "Notes", "Why Entered", "What Happened", "Lesson Learned"];
    const csvContent = [
      headers.join(","),
      ...trades.map(t => {
        const pnl = t.pnl || (t.exit && t.entry ? ((t.direction === 'LONG' ? t.exit - t.entry : t.entry - t.exit) * t.quantity).toFixed(2) : '');
        return [
          t.entry_date || t.date,
          t.symbol,
          t.direction,
          t.status,
          t.entry,
          t.exit || '',
          t.stopLoss || '',
          t.takeProfit || '',
          t.quantity || '',
          pnl,
          `"${(t.notes || '').replace(/"/g, '""')}"`,
          `"${(t.whyEntered || '').replace(/"/g, '""')}"`,
          `"${(t.whatHappened || '').replace(/"/g, '""')}"`,
          `"${(t.lessonLearned || t.lessons_learned || '').replace(/"/g, '""')}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `trade_journal_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const handleExportPDFSummary = () => {
    if (!trades || trades.length === 0) {
      alert("No trades to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Trade Journal Summary Report", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Trades: ${trades.length}`, 14, 36);

    const tableData = trades.map(t => {
      const pnl = t.pnl || (t.exit && t.entry ? ((t.direction === 'LONG' ? t.exit - t.entry : t.entry - t.exit) * t.quantity).toFixed(2) : '-');
      return [
        new Date(t.entry_date || t.date).toLocaleDateString(),
        t.symbol,
        t.direction,
        t.status,
        pnl
      ];
    });

    doc.autoTable({
      startY: 45,
      head: [['Date', 'Symbol', 'Direction', 'Status', 'PnL']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`trade_summary_${new Date().toISOString().slice(0,10)}.pdf`);
    onClose();
  };

  const handleExportPDFJournal = () => {
    if (!trades || trades.length === 0) {
      alert("No trades to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Trade Journal Book", 14, 22);
    
    let yPos = 40;
    
    trades.forEach((t, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`Trade #${index + 1}: ${t.symbol} (${t.direction})`, 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.text(`Date: ${new Date(t.entry_date || t.date).toLocaleString()}`, 14, yPos);
      yPos += 6;
      doc.text(`Status: ${t.status} | Entry: ${t.entry} | Exit: ${t.exit || '-'}`, 14, yPos);
      yPos += 6;
      
      const pnl = t.pnl || (t.exit && t.entry ? ((t.direction === 'LONG' ? t.exit - t.entry : t.entry - t.exit) * t.quantity).toFixed(2) : '-');
      doc.text(`PnL: $${pnl}`, 14, yPos);
      yPos += 10;
      
      if (t.whyEntered) {
        doc.text("Reason for entry:", 14, yPos);
        yPos += 5;
        const splitText = doc.splitTextToSize(t.whyEntered, 180);
        doc.text(splitText, 14, yPos);
        yPos += (splitText.length * 5) + 5;
      }
      
      if (t.lessonLearned) {
        doc.text("Lesson Learned:", 14, yPos);
        yPos += 5;
        const splitText = doc.splitTextToSize(t.lessonLearned, 180);
        doc.text(splitText, 14, yPos);
        yPos += (splitText.length * 5) + 5;
      }
      
      yPos += 10; // Space between trades
    });

    doc.save(`trade_journal_book_${new Date().toISOString().slice(0,10)}.pdf`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Тайлан татах (Export)</h2>
            <p className="text-sm text-slate-400 mt-1">Өөрийн датаг анализ хийх эсвэл хадгалах зорилгоор татаж авах</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* CSV Export */}
          <button onClick={handleExportCSV} className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800 hover:border-slate-700 transition-all text-left group">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
              <FileSpreadsheet className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-1">CSV Raw Data</h3>
              <p className="text-sm text-slate-400">Бүх арилжааны түүхий дата. Excel дээр өөрийн хүссэнээр анализ хийх, backup авахад тохиромжтой.</p>
            </div>
            <Download className="w-5 h-5 text-slate-500 group-hover:text-white mt-1" />
          </button>

          {/* PDF Summary */}
          <button onClick={handleExportPDFSummary} className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800 hover:border-slate-700 transition-all text-left group">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-1">PDF Summary Report</h3>
              <p className="text-sm text-slate-400">Сонгосон хугацааны ашиг алдагдал, сэтгэл зүй, алдааны нэгтгэсэн тайлан. Ментортоо илгээхэд тохиромжтой.</p>
            </div>
            <Download className="w-5 h-5 text-slate-500 group-hover:text-white mt-1" />
          </button>

          {/* PDF Journal */}
          <button onClick={handleExportPDFJournal} className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800 hover:border-slate-700 transition-all text-left group">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-1">PDF Journal Book</h3>
              <p className="text-sm text-slate-400">Арилжаа бүрийн дэлгэрэнгүй тэмдэглэл, зураг (screenshot)-тайгаа хамт хэвлэгдэх боломжтой хэлбэрээр.</p>
            </div>
            <Download className="w-5 h-5 text-slate-500 group-hover:text-white mt-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
