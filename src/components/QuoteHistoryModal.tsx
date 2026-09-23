import { useState, useEffect, type MouseEvent } from 'react';
import { History, X, Trash2, ArrowUpRight, FolderOpen, Calendar, Building, DollarSign } from 'lucide-react';
import type { SavedQuote } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoadQuote: (quote: SavedQuote) => void;
}

const STORAGE_KEY = 'sme_saved_quotes';

export function getSavedQuotes(): SavedQuote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading saved quotes', e);
  }
  return [];
}

export function saveQuoteToStorage(quote: SavedQuote): void {
  try {
    const list = getSavedQuotes();
    // Prepend new quote, keep maximum 30 recent quotes
    const filtered = list.filter((item) => item.id !== quote.id);
    const updated = [quote, ...filtered].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving quote', e);
  }
}

export default function QuoteHistoryModal({ isOpen, onClose, onLoadQuote }: Props) {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuotes(getSavedQuotes());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa báo giá này khỏi lịch sử không?')) {
      const updated = quotes.filter((q) => q.id !== id);
      setQuotes(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        // ignore
      }
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử báo giá không?')) {
      setQuotes([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        // ignore
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Lịch sử Báo giá đã lưu</h3>
              <p className="text-xs text-slate-400">Xem và nạp lại cấu hình báo giá khách hàng cũ chỉ với 1 click</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {quotes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-600">Chưa có báo giá nào được lưu</p>
              <p className="text-xs text-slate-400 mt-1">
                Khi tạo báo giá, bấm nút <span className="font-semibold text-slate-600">"Lưu báo giá"</span> ở bảng bên phải để lưu lại vào đây.
              </p>
            </div>
          ) : (
            quotes.map((q) => {
              const subtotal = q.cart.reduce((sum, item) => sum + item.monthlyPrice * item.quantity, 0);
              const disc = Number(q.discountPercent) || 0;
              const discAmt = Math.round(subtotal * (disc / 100));
              const afterDisc = subtotal - discAmt;
              const total = Math.round(afterDisc * 1.1);

              return (
                <div
                  key={q.id}
                  onClick={() => {
                    onLoadQuote(q);
                    onClose();
                  }}
                  className="group p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 bg-white transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {q.quoteInfo.quoteCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {q.quoteInfo.title}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {q.quoteInfo.customerName || 'Chưa đặt tên KH'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {q.quoteInfo.date}
                      </span>
                      <span>• {q.cart.length} dịch vụ</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 block">Tổng thanh toán</span>
                      <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(q.id, e)}
                        title="Xóa báo giá này"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                      >
                        <span>Mở lại</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {quotes.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              Xóa tất cả lịch sử
            </button>
            <span className="text-xs text-slate-400">Lưu tối đa 30 báo giá gần nhất trên máy</span>
          </div>
        )}
      </div>
    </div>
  );
}
