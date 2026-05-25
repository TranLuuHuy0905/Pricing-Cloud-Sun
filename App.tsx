import React, { useState } from 'react';
import { formatCurrency } from './utils/format';
import type { CartItem } from './types';
import * as XLSX from 'xlsx';

// Service Components (we will create these next)
import VMCustom from './components/services/VMCustom';
import VMPackages from './components/services/VMPackages';
import S3Storage from './components/services/S3Storage';
import Kubernetes from './components/services/Kubernetes';
import Database from './components/services/Database';
import VPC from './components/services/VPC';
import LoadBalancer from './components/services/LoadBalancer';
import CustomService from './components/services/CustomService';

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
  PlusCircle
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

  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.monthlyPrice * item.quantity, 0);
  const parsedDiscountPercent = Number(discountPercent) || 0;
  const discountAmount = Math.round(subtotal * (parsedDiscountPercent / 100));
  const priceAfterDiscount = subtotal - discountAmount;
  const vat = Math.round(priceAfterDiscount * 0.1);
  const total = priceAfterDiscount + vat;

  const handleExportExcel = () => {
    if (cart.length === 0) return;

    const data = cart.map((item, index) => ({
      STT: index + 1,
      'Dịch vụ': item.serviceName,
      'Mô tả': item.description,
      'Số lượng': item.quantity,
      'Đơn giá / tháng': item.monthlyPrice,
      'Thành tiền': item.monthlyPrice * item.quantity,
    }));

    data.push({
      STT: '' as any,
      'Dịch vụ': 'Tổng trước thuế (Subtotal)',
      'Mô tả': '',
      'Số lượng': '' as any,
      'Đơn giá / tháng': '' as any,
      'Thành tiền': subtotal,
    });
    
    if (parsedDiscountPercent > 0) {
      data.push({
        STT: '' as any,
        'Dịch vụ': `Giảm giá (${parsedDiscountPercent}%)`,
        'Mô tả': '',
        'Số lượng': '' as any,
        'Đơn giá / tháng': '' as any,
        'Thành tiền': -discountAmount,
      });
      data.push({
        STT: '' as any,
        'Dịch vụ': 'Giá sau giảm',
        'Mô tả': '',
        'Số lượng': '' as any,
        'Đơn giá / tháng': '' as any,
        'Thành tiền': priceAfterDiscount,
      });
    }

    data.push({
      STT: '' as any,
      'Dịch vụ': 'VAT (10%)',
      'Mô tả': '',
      'Số lượng': '' as any,
      'Đơn giá / tháng': '' as any,
      'Thành tiền': vat,
    });

    data.push({
      STT: '' as any,
      'Dịch vụ': 'Tổng thanh toán (VNĐ)',
      'Mô tả': '',
      'Số lượng': '' as any,
      'Đơn giá / tháng': '' as any,
      'Thành tiền': total,
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BaoGia');
    
    worksheet['!cols'] = [
      { wch: 5 },  
      { wch: 30 }, 
      { wch: 60 }, 
      { wch: 10 }, 
      { wch: 20 }, 
      { wch: 20 }  
    ];

    XLSX.writeFile(workbook, 'BaoGia_Cloud.xlsx');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-semibold text-slate-800">Cloud Pricing Calculator</h1>
        <p className="text-sm text-slate-500">Ước tính chi phí dịch vụ Cloud hàng tháng</p>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
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
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {SERVICES.map((service) => {
              const Component = service.component;
              if (activeTab !== service.id) return null;
              return <Component key={service.id} onAdd={handleAddToCart} />;
            })}
          </div>
        </div>

        {/* Right pane: Order Summary */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden sticky top-24">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800">Cấu hình Đã chọn</h2>
          </div>
          
          <div className="p-5 max-h-[40vh] overflow-y-auto space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Chưa có dịch vụ nào được chọn</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4 items-start group">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-slate-800 truncate pr-2">{item.serviceName}</p>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{item.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">SL: {item.quantity}</span>
                      <span className="text-sm font-semibold text-slate-800">{formatCurrency(item.monthlyPrice * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
            <div className="space-y-2">
               <div className="flex justify-between text-sm text-slate-600">
                <span>Tổng trước thuế (Subtotal)</span>
                <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm py-2">
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
                    className="w-full px-3 py-1.5 text-right border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {parsedDiscountPercent > 0 && (
                <>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Số tiền được giảm</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-2 px-3 bg-amber-50 border border-amber-200 rounded-md">
                    <span className="font-semibold text-amber-800">Giá sau giảm (Min bán ra)</span>
                    <span className="font-bold text-amber-700 text-base">{formatCurrency(priceAfterDiscount)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm text-slate-600">
                <span>VAT (10%)</span>
                <span>{formatCurrency(vat)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                   <span className="text-base font-semibold text-slate-800">Tổng thanh toán</span>
                   <span className="text-xs text-slate-500">(Theo tháng)</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
            
            <button
               onClick={handleExportExcel}
               disabled={cart.length === 0}
               className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Xuất file báo giá (Excel)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
