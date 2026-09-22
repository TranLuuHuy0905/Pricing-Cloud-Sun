import React, { useState } from 'react';
import { formatCurrency } from './utils/format';
import type { CartItem, QuoteInfo } from './types';
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
  FileCheck
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

export default function App() {
  const [activeTab, setActiveTab] = useState(SERVICES[0].id);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number | string>('');

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
    };
  });

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
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

  const subtotal = cart.reduce((acc, item) => acc + item.monthlyPrice * item.quantity, 0);
  const parsedDiscountPercent = Number(discountPercent) || 0;
  const discountAmount = Math.round(subtotal * (parsedDiscountPercent / 100));
  const priceAfterDiscount = subtotal - discountAmount;
  const vat = Math.round(priceAfterDiscount * 0.1);
  const total = priceAfterDiscount + vat;

  const handleExportExcel = () => {
    if (cart.length === 0) return;

    // Build professional AOA format
    const aoa: any[][] = [
      ['BẢNG BÁO GIÁ DỊCH VỤ ĐIỆN TOÁN ĐÁM MÂY (CLOUD)'],
      [],
      ['Tên báo giá:', quoteInfo.title, '', 'Mã báo giá:', quoteInfo.quoteCode],
      ['Khách hàng / Đơn vị:', quoteInfo.customerName || 'Quý khách hàng', '', 'Ngày lập:', quoteInfo.date],
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

    if (parsedDiscountPercent > 0) {
      aoa.push(
        ['', `Giảm giá (${parsedDiscountPercent}%)`, '', '', '', -discountAmount],
        ['', 'Giá sau giảm', '', '', '', priceAfterDiscount]
      );
    }

    aoa.push(
      ['', 'Thuế GTGT - VAT (10%)', '', '', '', vat],
      ['', 'TỔNG CỘNG THANH TOÁN (VNĐ/tháng)', '', '', '', total],
      [],
      ['* Báo giá đã bao gồm hỗ trợ kỹ thuật 24/7 và cam kết SLA hạ tầng 99.9%.']
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

    // Sanitize Vietnamese filename
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
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Cloud Pricing Calculator</h1>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">Pro</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Ước tính chi phí, chỉnh sửa cấu hình và xuất báo giá dịch vụ Cloud</p>
          </div>

          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                {cart.length} dịch vụ đã chọn
              </span>
            )}
            <button
              onClick={handleExportExcel}
              disabled={cart.length === 0}
              className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Quote Title & Metadata Section */}
        <QuoteInfoSection info={quoteInfo} onChange={setQuoteInfo} />

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

            {/* Config Area */}
            <div className="flex-1 bg-white rounded-xl shadow-xs border border-slate-200 p-6">
              {SERVICES.map((service) => {
                const Component = service.component;
                if (activeTab !== service.id) return null;
                return <Component key={service.id} onAdd={handleAddToCart} />;
              })}
            </div>
          </div>

          {/* Right pane: Order Summary & Cart */}
          <div className="lg:col-span-4 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden sticky top-24">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">Cấu hình Đã chọn</h2>
                <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                  title="Xóa tất cả"
                >
                  <RotateCcw className="w-3 h-3" />
                  Xóa tất cả
                </button>
              )}
            </div>
            
            {/* Cart Items List */}
            <div className="p-4 max-h-[42vh] overflow-y-auto space-y-3 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Chưa có dịch vụ nào trong báo giá</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Chọn các dịch vụ ở danh mục bên trái và nhấn "+ Thêm vào báo giá" để bắt đầu.</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={item.id} className={`group ${index > 0 ? 'pt-3' : ''}`}>
                    {/* Item Top: Name and action buttons */}
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-1">{item.serviceName}</p>
                      
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Chỉnh sửa chi tiết cấu hình"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDuplicateItem(item)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Nhân bản cấu hình"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Xóa cấu hình"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item Description */}
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-line font-sans leading-relaxed line-clamp-4">
                      {item.description}
                    </p>

                    {/* Item Bottom: Quantity control & Price */}
                    <div className="mt-2.5 flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      {/* Quick Quantity Stepper */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">SL:</span>
                        <div className="inline-flex items-center border border-slate-200 rounded bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
                            className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-slate-800 min-w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Line total */}
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800">
                          {formatCurrency(item.monthlyPrice * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[10px] text-slate-400">
                            ({formatCurrency(item.monthlyPrice)}/mục)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price Calculations */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3.5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tổng trước thuế (Subtotal)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm py-1.5">
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

                {parsedDiscountPercent > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Số tiền được giảm ({parsedDiscountPercent}%)</span>
                      <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-2 px-3 bg-amber-50 border border-amber-200 rounded-md">
                      <span className="font-semibold text-amber-800">Giá sau giảm</span>
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
                    <span className="text-sm font-semibold text-slate-700">Tổng thanh toán</span>
                    <span className="text-xs text-slate-500">(Theo tháng)</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>
              
              <button
                onClick={handleExportExcel}
                disabled={cart.length === 0}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Xuất file báo giá (Excel)
              </button>
            </div>
          </div>
        </div>
      </main>

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

