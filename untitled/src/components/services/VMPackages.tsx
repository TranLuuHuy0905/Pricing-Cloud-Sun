import { useState } from 'react';
import { PRICING } from '../../config/pricing';
import type { CartItem } from '../../types';
import { Plus } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { formatCurrency } from '../../utils/format';

interface Props {
  onAdd: (item: CartItem) => void;
}

export default function VMPackages({ onAdd }: Props) {
  const [tier, setTier] = useState<'standard' | 'premium'>('standard');
  const [selectedGroup, setSelectedGroup] = useState<string>('TINY');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  const [quantity, setQuantity] = useState<number | string>(1);
  const parsedQuantity = Math.max(1, Number(quantity) || 1);

  const packages = PRICING.vmPackages[tier];
  
  // Get unique groups
  const groups = Array.from(new Set(packages.map(p => p.group)));
  
  const filteredPackages = packages.filter(p => p.group === selectedGroup);
  
  // Auto select first package in group if current is invalid
  if (selectedPackageId && !filteredPackages.find(p => p.id === selectedPackageId)) {
    setSelectedPackageId(filteredPackages[0]?.id || '');
  } else if (!selectedPackageId && filteredPackages.length > 0) {
    setSelectedPackageId(filteredPackages[0].id);
  }

  const selectedPkg = packages.find(p => p.id === selectedPackageId);

  const calculatePrice = () => {
    return selectedPkg?.price || 0;
  };

  const handleAdd = () => {
    if (!selectedPkg) return;
    
    onAdd({
      id: crypto.randomUUID(),
      serviceId: 'vmPackage',
      serviceName: 'Máy chủ ảo (Gói tĩnh)',
      description: `Gói: ${tier.toUpperCase()} - ${selectedGroup}\n- Cấu hình: ${selectedPkg.name}\n- System Disk: 20GB HDD IOPS 400`,
      quantity: parsedQuantity,
      monthlyPrice: calculatePrice()
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Chọn gói cấu hình VM có sẵn</h3>
      <p className="text-sm text-slate-500 mb-6">Mặc định bao gồm 20GB System Disk (HDD IOPS 400) cho mọi gói.</p>
      
      <div className="space-y-5">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Hạng dịch vụ (Tier)</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" className="w-4 h-4 text-blue-600 focus:ring-blue-500" checked={tier === 'standard'} onChange={() => { setTier('standard'); setSelectedGroup('TINY'); }} />
              <span className="text-sm">Standard</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" className="w-4 h-4 text-blue-600 focus:ring-blue-500" checked={tier === 'premium'} onChange={() => { setTier('premium'); setSelectedGroup('TINY'); }} />
              <span className="text-sm">Premium</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Dòng máy (Family)</label>
          <div className="flex flex-wrap gap-2">
            {groups.map(group => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  selectedGroup === group 
                   ? 'bg-slate-800 text-white border-slate-800' 
                   : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-sm font-medium text-slate-700">Cấu hình (CPU / RAM)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filteredPackages.map(pkg => (
              <div 
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  selectedPackageId === pkg.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-semibold text-slate-800 mb-1">{pkg.name}</div>
                <div className="text-sm text-blue-600 font-medium">{formatCurrency(pkg.price)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
           <h4 className="text-sm font-semibold text-slate-800 mb-4">Lưu trữ (Storage)</h4>
           
           <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <div className="flex items-start gap-3">
               <div className="flex-shrink-0 animate-pulse mt-1">
                 <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
               </div>
               <div>
                 <h5 className="text-sm font-medium text-slate-800">System Disk (Mặc định)</h5>
                 <p className="text-sm text-slate-600 mt-1">
                   Mỗi gói cấu hình đã được bao gồm sẵn <span className="font-semibold text-slate-800">20GB Hệ thống</span>, sử dụng đĩa <span className="font-semibold text-slate-800">HDD</span> với tốc độ <span className="font-semibold text-slate-800">400 IOPS</span>. 
                 </p>
                 <p className="text-xs text-slate-500 mt-2">
                   Không phát sinh thêm chi phí, không cần cấu hình thêm.
                 </p>
               </div>
             </div>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 mt-8">
        <div className="flex items-center gap-4">
           <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Số lượng:</label>
           <div className="w-32">
             <NumberInput value={quantity} onChange={setQuantity} min={1} />
           </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
             <p className="text-xs text-slate-500">Tạm tính (chưa VAT)</p>
             <p className="text-lg font-bold text-blue-600">{formatCurrency(calculatePrice() * parsedQuantity)}/tháng</p>
           </div>
           <button onClick={handleAdd} disabled={!selectedPkg} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
             <Plus className="w-4 h-4" />
             Thêm
           </button>
        </div>
      </div>
    </div>
  );
}
