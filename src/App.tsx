import React, { useState, useEffect } from 'react';
import { formatCurrency } from './utils/format';
import type { CartItem, QuoteInfo, SalesProfile, SavedQuote } from './types';
import * as XLSX from 'xlsx';

// Service Components
import VMCustom from './components/services/VMCustom';
import VMPackages from './components/services/VMPackages';
import S3Storage from './components/services/S3Storage';
import Kubernetes from './components/services/Kubernetes';
import Database from './components/services/Database';
import VPC from './components/services/VPC';
import LoadBalancer from './components/services/LoadBalancer';
import CustomService from './components/services/CustomService';

// Custom UI Components
import EditItemModal from './components/EditItemModal';
import QuoteInfoSection from './components/QuoteInfoSection';
import SizingWizardModal from './components/SizingWizardModal';
import CrossSellBanner from './components/CrossSellBanner';
import SalesProfileModal, { getStoredSalesProfile } from './components/SalesProfileModal';
import QuoteHistoryModal, { saveQuoteToStorage } from './components/QuoteHistoryModal';
import ShareAndExportActions from './components/ShareAndExportActions';

import { 
  Server, 
  Package, 
  HardDrive, 
  Box, 
  Database as DbIcon, 
  Network, 
  GitBranch,
  Trash2,
  Download,
  PlusCircle,
  Pencil,
  Copy,
  Plus,
  Minus,
  RotateCcw,
  FileCheck,
  Sparkles,
  UserCheck,
  History,
  CalendarDays
} from 'lucide-react';

const SERVICES: Array<{
  id: string;
  name: string;
  icon: React.ElementType;
  component: React.ElementType<{ onAdd: (item: CartItem) => void }>;
}> = [
  { id: 'vmCustom', name: 'VM Tùy chỉnh', icon: Server, component: VMCustom },
  { id: 'vmPackages', name: 'VM Theo gói', icon: Package, component: VMPackages },
  { id: 's3', name: 'Lưu trữ S3', icon: HardDrive, component: S3Storage },
  { id: 'k8s', name: 'Kubernetes (K8S)', icon: Box, component: Kubernetes },
  { id: 'db', name: 'Database', icon: DbIcon, component: Database },
  { id: 'vpc', name: 'Mạng riêng ảo (VPC)', icon: Network, component: VPC },
  { id: 'lb', name: 'Load Balancer', icon: GitBranch, component: LoadBalancer },
  { id: 'custom', name: 'Dịch vụ / SP khác', icon: PlusCircle, component: CustomService },
];

const BILLING_CYCLES = [
  { months: 1, label: '1 tháng' },
  { months: 3, label: '3 tháng' },
  { months: 6, label: '6 tháng' },
  { months: 12, label: '12 tháng' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(SERVICES[0].id);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number | string>('');
  const [billingCycleMonths, setBillingCycleMonths] = useState<number>(1);

  // Quote Metadata
  const [quoteInfo, setQuoteInfo] = useState<QuoteInfo>(() => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return {
      title: 'Báo giá Dịch vụ Cloud',
      customerName: '',
      quoteCode: `BG-${dateStr}-${rand}`,
      date: today.toISOString().slice(0, 10),
      notes: 'Báo giá có hiệu lực trong vòng 30 ngày.',
      salesProfile: getStoredSalesProfile(),
      billingCycleMonths: 1,
    };
  });

  // Modals state
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Load profile from localStorage and check URL hash on mount
  useEffect(() => {
    // 1. Initial sales profile
    const storedProf = getStoredSalesProfile();
    if (storedProf) {
      setQuoteInfo((prev) => ({
        ...prev,
        salesProfile: storedProf,
      }));
    }

    // 2. Check if URL contains shared quote hash
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('quote=')) {
        const base64 = hash.split('quote=')[1];
        if (base64) {
          const jsonStr = decodeURIComponent(atob(base64));
          const parsed = JSON.parse(jsonStr);
          if (parsed.q) setQuoteInfo(parsed.q);
          if (parsed.c && Array.isArray(parsed.c)) setCart(parsed.c);
          if (parsed.d !== undefined) setDiscountPercent(parsed.d);
          if (parsed.m !== undefined) setBillingCycleMonths(parsed.m);
        }
      }
    } catch (e) {
      console.error('Failed to load shared quote from URL hash', e);
    }
  }, []);

  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
  };

  const handleApplyPresetItems = (items: CartItem[]) => {
    setCart((prev) => [...prev, ...items]);
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleOpenEdit = (item: CartItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updated: CartItem) => {
    setCart((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleDuplicateItem = (item: CartItem) => {
    const duplicated: CartItem = {
      ...item,
      id: crypto.randomUUID(),
      serviceName: `${item.serviceName} (Bản sao)`,
    };
    setCart((prev) => [...prev, duplicated]);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách cấu hình đã chọn không?')) {
      setCart([]);
    }
  };

  // Pricing calculations
  const subtotal = cart.reduce((acc, item) => acc + item.monthlyPrice * item.quantity, 0);
  const totalDiscountPercent = Math.min(100, Math.max(0, Number(discountPercent) || 0));

  const discountAmount = Math.round(subtotal * (totalDiscountPercent / 100));
  const priceAfterDiscount = subtotal - discountAmount;
  const vat = Math.round(priceAfterDiscount * 0.1);
  const total = priceAfterDiscount + vat;
  const cycleGrandTotal = total * billingCycleMonths;

  // Save current quote to history
  const handleSaveDraft = () => {
    const savedQuote: SavedQuote = {
      id: quoteInfo.quoteCode || `BG-${Date.now()}`,
      savedAt: new Date().toLocaleString('vi-VN'),
      quoteInfo,
      cart,
      discountPercent,
    };
    saveQuoteToStorage(savedQuote);
  };

  const handleLoadSavedQuote = (saved: SavedQuote) => {
    setQuoteInfo(saved.quoteInfo);
    setCart(saved.cart);
    setDiscountPercent(saved.discountPercent);
    if (saved.quoteInfo.billingCycleMonths) {
      setBillingCycleMonths(saved.quoteInfo.billingCycleMonths);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (cart.length === 0) return;

    const salesName = quoteInfo.salesProfile?.name || 'Phòng SME HCM';
    const salesPhone = quoteInfo.salesProfile?.phone || '';
    const salesEmail = quoteInfo.salesProfile?.email || '';
    const salesTitle = quoteInfo.salesProfile?.title || 'Chuyên viên tư vấn Cloud';

    const aoa: any[][] = [
      ['BẢNG BÁO GIÁ DỊCH VỤ ĐIỆN TOÁN ĐÁM MÂY (CLOUD)'],
      [],
      ['Tên báo giá:', quoteInfo.title, '', 'Mã báo giá:', quoteInfo.quoteCode],
      ['Khách hàng / Đơn vị:', quoteInfo.customerName || 'Quý khách hàng', '', 'Ngày lập:', quoteInfo.date],
      ['Chuyên viên tư vấn:', `${salesName} (${salesTitle})`, '', 'Điện thoại/Zalo:', salesPhone],
      ['Email liên hệ:', salesEmail, '', 'Chu kỳ thanh toán:', `${billingCycleMonths} tháng`],
      ['Hiệu lực báo giá:', quoteInfo.notes || '30 ngày kể từ ngày lập', '', 'Đơn vị tính:', 'VNĐ / tháng'],
      [],
      ['STT', 'Dịch vụ', 'Cấu hình chi tiết', 'Số lượng', 'Đơn giá / tháng (VNĐ)', 'Thành tiền (VNĐ)'],
      ...cart.map((item, index) => [
        index + 1,
        item.serviceName,
        item.description,
        item.quantity,
        item.monthlyPrice,
        item.monthlyPrice * item.quantity,
      ]),
      [],
      ['', 'Tổng trước thuế (Subtotal)', '', '', '', subtotal],
    ];

    if (totalDiscountPercent > 0) {
      aoa.push(
        ['', `Giảm giá (${totalDiscountPercent}%)`, '', '', '', -discountAmount],
        ['', 'Giá sau giảm', '', '', '', priceAfterDiscount]
      );
    }

    aoa.push(
      ['', 'Thuế GTGT - VAT (10%)', '', '', '', vat],
      ['', 'TỔNG CỘNG / THÁNG (VNĐ)', '', '', '', total]
    );

    if (billingCycleMonths > 1) {
      aoa.push(
        ['', `TỔNG THANH TOÁN THEO KỲ (${billingCycleMonths} THÁNG)`, '', '', '', cycleGrandTotal]
      );
    }

    aoa.push(
      [],
      ['* Báo giá đã bao gồm hỗ trợ kỹ thuật 24/7/365 và cam kết SLA hạ tầng 99.99%.'],
      [`* Mọi thắc mắc xin vui lòng liên hệ chuyên viên: ${salesName} - SĐT: ${salesPhone}`]
    );

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BaoGia');

    worksheet['!cols'] = [
      { wch: 6 },   // STT
      { wch: 28 },  // Dịch vụ
      { wch: 55 },  // Cấu hình chi tiết
      { wch: 12 },  // Số lượng
      { wch: 22 },  // Đơn giá
      { wch: 22 },  // Thành tiền
    ];

    const sanitize = (str: string) => 
      str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

    const titleSlug = sanitize(quoteInfo.title) || 'Bao_Gia_Cloud';
    const customerSlug = quoteInfo.customerName ? `_${sanitize(quoteInfo.customerName)}` : '';
    const dateSlug = quoteInfo.date ? `_${quoteInfo.date}` : '';
    const fileName = `${titleSlug}${customerSlug}${dateSlug}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Cloud Pricing Calculator</h1>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">by HuyVoi</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Ước tính chi phí và báo giá dịch vụ Cloud Phòng SME HCM</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Sizing Wizard Trigger */}
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Trợ lý Sizing (Wizard)</span>
            </button>

            {/* Sales Profile Trigger */}
            <button
              type="button"
              onClick={() => setIsSalesModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-2xs"
            >
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Hồ sơ Sales</span>
            </button>

            {/* Quote History Trigger */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-2xs"
            >
              <History className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Lịch sử</span>
            </button>

            {cart.length > 0 && (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                {cart.length} dịch vụ
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Quote Title & Metadata Section */}
        <QuoteInfoSection 
          info={quoteInfo} 
          onChange={setQuoteInfo} 
          onOpenSalesProfile={() => setIsSalesModalOpen(true)}
        />

        {/* Cross-Sell & Upsell Alert Banner */}
        <CrossSellBanner cart={cart} onAddToCart={handleAddToCart} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left pane: Service selection and config */}
          <div className="lg:col-span-8 flex flex-col md:flex-row gap-6">
            {/* Tabs */}
            <div className="w-full md:w-64 flex-shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {SERVICES.map((service) => {
                const Icon = service.icon;
                const isActive = activeTab === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setActiveTab(service.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap md:whitespace-normal text-left
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-100 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {service.name}
                  </button>
                );
              })}
            </div>

            {/* Active Service Form */}
            <div className="flex-1 bg-white rounded-xl shadow-xs border border-slate-200 p-6">
              {(() => {
                const current = SERVICES.find((s) => s.id === activeTab);
                if (!current) return null;
                const Component = current.component;
                return <Component onAdd={handleAddToCart} />;
              })()}
            </div>
          </div>

          {/* Right pane: Cart & Pricing Summary */}
          <div className="lg:col-span-4 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden sticky top-24">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-800">Cấu hình đã chọn</h2>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                  {cart.length}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="p-4 divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Box className="w-12 h-12 mx-auto mb-2 opacity-50 stroke-[1.5]" />
                  <p className="text-sm">Chưa có dịch vụ nào được chọn</p>
                  <p className="text-xs mt-1 text-slate-400">Chọn dịch vụ bên trái hoặc bấm "Trợ lý Sizing" để thêm</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 group">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-medium text-sm text-slate-800 truncate">{item.serviceName}</h4>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Sửa cấu hình & số lượng"
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDuplicateItem(item)}
                            title="Nhân bản cấu hình này"
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 whitespace-pre-line mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Xóa dịch vụ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-2.5 text-xs">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-semibold text-slate-700 text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-slate-800">
                          {formatCurrency(item.monthlyPrice * item.quantity)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-slate-400">
                            {formatCurrency(item.monthlyPrice)} x {item.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price Calculations */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3.5">
              {/* Billing Cycle Selector */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                  Chu kỳ thanh toán
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {BILLING_CYCLES.map((cycle) => {
                    const isSelected = billingCycleMonths === cycle.months;
                    return (
                      <button
                        key={cycle.months}
                        type="button"
                        onClick={() => {
                          setBillingCycleMonths(cycle.months);
                          setQuoteInfo((prev) => ({ ...prev, billingCycleMonths: cycle.months }));
                        }}
                        className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cycle.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tổng trước thuế (Giá list)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm py-1">
                  <span className="text-slate-600">Giảm giá (%)</span>
                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          setDiscountPercent('');
                        } else {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0 && val <= 100) {
                            setDiscountPercent(val);
                          }
                        }
                      }}
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-right border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-semibold"
                    />
                  </div>
                </div>

                {totalDiscountPercent > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Số tiền được giảm ({totalDiscountPercent}%)</span>
                      <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-2 px-3 bg-amber-50 border border-amber-200 rounded-md">
                      <span className="font-semibold text-amber-800">Giá sau giảm / tháng (bán ra)</span>
                      <span className="font-bold text-amber-700 text-base">{formatCurrency(priceAfterDiscount)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-sm text-slate-600">
                  <span>VAT (10%)</span>
                  <span>{formatCurrency(vat)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700">Tổng thanh toán / tháng</span>
                    <span className="text-xs text-slate-500">(Đã gồm VAT)</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
                </div>

                {billingCycleMonths > 1 && (
                  <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg flex justify-between items-center text-xs">
                    <span className="text-indigo-900 font-medium">Tổng theo kỳ ({billingCycleMonths} tháng):</span>
                    <span className="text-indigo-700 font-bold text-sm">{formatCurrency(cycleGrandTotal)}</span>
                  </div>
                )}
              </div>
              
              {/* Export Excel Button */}
              <button
                onClick={handleExportExcel}
                disabled={cart.length === 0}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Xuất file Excel báo giá</span>
              </button>

              {/* Share & Quick Actions (Zalo, Share Link, Save Draft) */}
              <ShareAndExportActions
                cart={cart}
                quoteInfo={quoteInfo}
                subtotal={subtotal}
                discountPercent={totalDiscountPercent}
                discountAmount={discountAmount}
                priceAfterDiscount={priceAfterDiscount}
                vat={vat}
                total={total}
                billingCycleMonths={billingCycleMonths}
                onOpenHistory={() => setIsHistoryModalOpen(true)}
                onSaveDraft={handleSaveDraft}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Sizing Wizard Modal */}
      <SizingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onApplyPreset={handleApplyPresetItems}
      />

      {/* Sales Profile Modal */}
      <SalesProfileModal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        currentProfile={quoteInfo.salesProfile}
        onSave={(updatedProfile) => {
          setQuoteInfo((prev) => ({ ...prev, salesProfile: updatedProfile }));
        }}
      />

      {/* Quote History Modal */}
      <QuoteHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onLoadQuote={handleLoadSavedQuote}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        item={editingItem}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
