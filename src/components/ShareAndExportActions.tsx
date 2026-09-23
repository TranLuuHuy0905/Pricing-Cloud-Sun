import { useState } from 'react';
import { MessageSquare, Share2, Check, Bookmark, History, FileText } from 'lucide-react';
import type { CartItem, QuoteInfo } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  cart: CartItem[];
  quoteInfo: QuoteInfo;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  priceAfterDiscount: number;
  vat: number;
  total: number;
  billingCycleMonths?: number;
  onOpenHistory: () => void;
  onSaveDraft: () => void;
}

export default function ShareAndExportActions({
  cart,
  quoteInfo,
  subtotal,
  discountPercent,
  discountAmount,
  priceAfterDiscount,
  vat,
  total,
  billingCycleMonths = 1,
  onOpenHistory,
  onSaveDraft,
}: Props) {
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedDraftAlert, setSavedDraftAlert] = useState(false);

  // Generate Zalo Text format
  const handleCopyZalo = () => {
    if (cart.length === 0) return;

    const salesName = quoteInfo.salesProfile?.name || 'Chuyên viên SME HCM';
    const salesPhone = quoteInfo.salesProfile?.phone || '';
    const customer = quoteInfo.customerName || 'Quý khách hàng';

    const cycleText = billingCycleMonths > 1 ? ` (Chu kỳ ${billingCycleMonths} tháng)` : ' (Theo tháng)';
    const cycleTotal = total * billingCycleMonths;

    let text = `📋 BÁO GIÁ DỊCH VỤ CLOUD - PHÒNG SME HCM\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 Khách hàng: ${customer}\n`;
    text += `🔖 Mã báo giá: ${quoteInfo.quoteCode}\n`;
    text += `📅 Ngày lập: ${quoteInfo.date}\n`;
    if (salesPhone) {
      text += `👨‍💼 Phụ trách: ${salesName} - ĐT/Zalo: ${salesPhone}\n`;
    } else {
      text += `👨‍💼 Phụ trách: ${salesName}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `📦 CẤU HÌNH CHI TIẾT:\n`;
    cart.forEach((item, index) => {
      text += `${index + 1}. ${item.serviceName} (SL: ${item.quantity})\n`;
      // Clean description lines
      const cleanDesc = item.description
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .join('; ');
      text += `   ↳ ${cleanDesc}\n`;
      text += `   ↳ Đơn giá: ${formatCurrency(item.monthlyPrice)}/tháng ➔ Thành tiền: ${formatCurrency(item.monthlyPrice * item.quantity)}/tháng\n\n`;
    });

    text += `💰 TỔNG HỢP CHI PHÍ:\n`;
    text += `• Tổng trước thuế: ${formatCurrency(subtotal)}/tháng\n`;
    if (discountPercent > 0) {
      text += `• Chiết khấu (${discountPercent}%): -${formatCurrency(discountAmount)}/tháng\n`;
      text += `• Giá sau chiết khấu: ${formatCurrency(priceAfterDiscount)}/tháng\n`;
    }
    text += `• Thuế VAT (10%): ${formatCurrency(vat)}/tháng\n`;
    text += `👉 TỔNG THANH TOÁN: ${formatCurrency(total)}/tháng${cycleText}\n`;
    if (billingCycleMonths > 1) {
      text += `👉 TỔNG TIỀN THEO KỲ (${billingCycleMonths} THÁNG): ${formatCurrency(cycleTotal)}\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🛡️ Cam kết SLA hạ tầng 99.99% • Hỗ trợ kỹ thuật 24/7/365\n`;
    if (salesPhone) {
      text += `📞 Hotline/Zalo giải đáp nhanh: ${salesPhone}`;
    }

    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  // Generate shareable link
  const handleCopyShareLink = () => {
    if (cart.length === 0) return;

    try {
      const payload = {
        q: quoteInfo,
        c: cart,
        d: discountPercent,
        m: billingCycleMonths,
      };
      const jsonStr = JSON.stringify(payload);
      // UTF-8 safe base64
      const base64 = btoa(encodeURIComponent(jsonStr));
      const url = new URL(window.location.href);
      url.hash = `quote=${base64}`;

      navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error('Error generating share link', e);
    }
  };

  const handleSaveClick = () => {
    onSaveDraft();
    setSavedDraftAlert(true);
    setTimeout(() => setSavedDraftAlert(false), 2000);
  };

  return (
    <div className="space-y-2 mt-3">
      {/* Primary Quick Copy Zalo Button */}
      <button
        type="button"
        onClick={handleCopyZalo}
        disabled={cart.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {copiedZalo ? (
          <>
            <Check className="w-4 h-4 text-emerald-300" />
            <span className="font-semibold text-emerald-100">Đã chép nội dung gửi Zalo!</span>
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4" />
            <span>Sao chép tóm tắt gửi Zalo</span>
          </>
        )}
      </button>

      {/* Secondary Actions: Share Link & Save Draft */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopyShareLink}
          disabled={cart.length === 0}
          title="Tạo link chia sẻ cấu hình báo giá này cho khách hàng hoặc đồng nghiệp"
          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Đã chép Link!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Link chia sẻ</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={cart.length === 0}
          title="Lưu bản nháp này vào máy tính để tải lại khi cần"
          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savedDraftAlert ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Đã lưu nháp!</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>Lưu báo giá</span>
            </>
          )}
        </button>
      </div>

      {/* History Button */}
      <button
        type="button"
        onClick={onOpenHistory}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <History className="w-3.5 h-3.5" />
        <span>Xem lịch sử báo giá đã lưu</span>
      </button>
    </div>
  );
}
