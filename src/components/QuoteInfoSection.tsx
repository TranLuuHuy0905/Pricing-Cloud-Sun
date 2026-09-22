import { useState } from 'react';
import type { QuoteInfo } from '../types';
import { 
  FileText, 
  Building, 
  Calendar, 
  Hash, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

interface Props {
  info: QuoteInfo;
  onChange: (updated: QuoteInfo) => void;
}

export default function QuoteInfoSection({ info, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const generateNewCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    onChange({
      ...info,
      quoteCode: `BG-${dateStr}-${rand}`
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 transition-all">
      {/* Top Banner / Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                <Sparkles className="w-3 h-3" />
                Thông tin Báo giá
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {info.quoteCode}
              </span>
            </div>

            {/* Editable Title input */}
            <div className="relative group">
              <input
                type="text"
                value={info.title}
                onChange={(e) => onChange({ ...info, title: e.target.value })}
                placeholder="Nhập tên tiêu đề báo giá..."
                className="w-full text-lg sm:text-xl font-bold text-slate-800 bg-transparent hover:bg-white/80 focus:bg-white px-2 py-1 -ml-2 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Quick toggle expand & Customer Badge */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-xs"
            >
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>{info.customerName || 'Thêm khách hàng'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable detailed fields */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
          {/* Tên khách hàng */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              Khách hàng / Đơn vị
            </label>
            <input
              type="text"
              value={info.customerName}
              onChange={(e) => onChange({ ...info, customerName: e.target.value })}
              placeholder="VD: Công ty TNHH ABC"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Mã báo giá */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-600" />
                Mã báo giá
              </span>
              <button 
                type="button"
                onClick={generateNewCode}
                title="Tạo mã mới"
                className="text-slate-400 hover:text-blue-600 text-[11px] flex items-center gap-0.5 normal-case font-normal"
              >
                <RotateCcw className="w-3 h-3" />
                Đổi mã
              </button>
            </label>
            <input
              type="text"
              value={info.quoteCode}
              onChange={(e) => onChange({ ...info, quoteCode: e.target.value })}
              placeholder="VD: BG-2026-001"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Ngày báo giá */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Ngày báo giá
            </label>
            <input
              type="date"
              value={info.date}
              onChange={(e) => onChange({ ...info, date: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Ghi chú báo giá */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              Ghi chú / Hiệu lực
            </label>
            <input
              type="text"
              value={info.notes || ''}
              onChange={(e) => onChange({ ...info, notes: e.target.value })}
              placeholder="VD: Hiệu lực 30 ngày..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
