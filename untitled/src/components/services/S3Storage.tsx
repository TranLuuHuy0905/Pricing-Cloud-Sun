import { useState } from 'react';
import { PRICING } from '../../config/pricing';
import type { CartItem } from '../../types';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface Props {
  onAdd: (item: CartItem) => void;
}

export default function S3Storage({ onAdd }: Props) {
  const [tier, setTier] = useState<'hot' | 'cold'>('hot');
  const [sizeStr, setSizeStr] = useState('100');
  
  let size = parseInt(sizeStr);
  if (isNaN(size)) size = 0;

  // Validation message
  const isInvalid = size < PRICING.s3.minGB;

  const calculatePrice = () => {
    // If not satisfying minGB, usually people charge at minGB or we just calculate based on actual if form validates it.
    // The requirement says "tối thiểu 100GB", let's strictly calculate based on user input, but disable add button if < 100.
    const pricePerGB = PRICING.s3[tier];
    return size * pricePerGB;
  };

  const handleAdd = () => {
    if (isInvalid) return;

    onAdd({
      id: crypto.randomUUID(),
      serviceId: 's3',
      serviceName: 'Lưu trữ Object Storage (S3)',
      description: `Loại: ${tier === 'hot' ? 'Hot Storage' : 'Cold Storage'}\n- Dung lượng: ${size} GB`,
      quantity: 1, // S3 usually is 1 instance
      monthlyPrice: calculatePrice()
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Cấu hình Lưu trữ S3</h3>
      
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setTier('hot')}
            className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${
              tier === 'hot' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <h4 className="font-semibold text-slate-800">Hot Storage</h4>
            <p className="text-sm text-slate-500 mt-1">Lưu trữ dữ liệu truy cập thường xuyên</p>
            <p className="text-sm font-medium text-blue-600 mt-3">{formatCurrency(PRICING.s3.hot)} / GB / tháng</p>
          </div>
          
          <div 
            onClick={() => setTier('cold')}
            className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${
              tier === 'cold' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <h4 className="font-semibold text-slate-800">Cold Storage</h4>
            <p className="text-sm text-slate-500 mt-1">Lưu trữ dữ liệu lưu trữ dài hạn (Backup, Archival)</p>
            <p className="text-sm font-medium text-blue-600 mt-3">{formatCurrency(PRICING.s3.cold)} / GB / tháng</p>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <label className="block text-sm font-medium text-slate-700">Dung lượng cần lưu trữ (GB)</label>
          <input 
            type="number" 
            min={PRICING.s3.minGB} 
            value={sizeStr} 
            onChange={e => setSizeStr(e.target.value)} 
            className={`w-full md:w-1/2 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${
              isInvalid && sizeStr !== '' ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'
            }`} 
          />
          {isInvalid && sizeStr !== '' && (
            <p className="text-red-500 text-xs mt-1">Dung lượng tối thiểu là {PRICING.s3.minGB} GB.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 mt-8">
        <div className="flex gap-4 items-center">
            {/* Kept empty for layout parity */}
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
             <p className="text-xs text-slate-500">Tạm tính (chưa VAT)</p>
             <p className="text-lg font-bold text-blue-600">{formatCurrency(calculatePrice())}/tháng</p>
           </div>
           <button 
             onClick={handleAdd} 
             disabled={isInvalid} 
             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <Plus className="w-4 h-4" />
             Thêm
           </button>
        </div>
      </div>
    </div>
  );
}
