import { useState } from 'react';
import { PRICING } from '../../config/pricing';
import type { CartItem } from '../../types';
import { Plus } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { formatCurrency } from '../../utils/format';

interface Props {
  onAdd: (item: CartItem) => void;
}

export default function Database({ onAdd }: Props) {
  const [selectedId, setSelectedId] = useState<string>(PRICING.database[0].id);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [ips, setIps] = useState<number | string>(1);
  const parsedQuantity = Math.max(1, Number(quantity) || 1);
  const parsedIps = Math.max(1, Number(ips) || 1);

  const selectedPkg = PRICING.database.find(p => p.id === selectedId);

  // Group packages for easy layout
  const groups = Array.from(new Set(PRICING.database.map(p => p.group)));

  const calculatePrice = () => {
    let total = selectedPkg?.price || 0;
    // Assuming 1 IP is included? The prompt says "Dịch vụ Database - Tính theo VNĐ/tháng (1 IP)".
    // So additional IPs cost extra? Oh, it says 1 IP is included. 
    // Let's add extra IPs at 100k like VM if ips > 1.
    if (parsedIps > 1) {
      total += (parsedIps - 1) * PRICING.vmCustom.ip;
    }
    return total;
  };

  const handleAdd = () => {
    if (!selectedPkg) return;

    onAdd({
      id: crypto.randomUUID(),
      serviceId: 'database',
      serviceName: 'Dịch vụ Database',
      description: `Gói: ${selectedPkg.group}\n- Cấu hình: ${selectedPkg.name}\n- Số lượng IP: ${parsedIps}`,
      quantity: parsedQuantity,
      monthlyPrice: calculatePrice()
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Cấu hình Database Service</h3>
      
      <div className="space-y-6">
        {groups.map(group => (
          <div key={group} className="space-y-3">
             <h4 className="text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-2 rounded-md">{group}</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
               {PRICING.database.filter(p => p.group === group).map(pkg => (
                 <div
                   key={pkg.id}
                   onClick={() => setSelectedId(pkg.id)}
                   className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                     selectedId === pkg.id 
                       ? 'border-blue-600 bg-blue-50' 
                       : 'border-slate-200 hover:border-slate-300 bg-white'
                   }`}
                 >
                   <p className="font-semibold text-slate-800 mb-2">{pkg.name}</p>
                   <p className="text-sm font-medium text-blue-600">{formatCurrency(pkg.price)}</p>
                 </div>
               ))}
             </div>
          </div>
        ))}

        <div className="space-y-2 max-w-sm pt-4">
           <label className="block text-sm font-medium text-slate-700">Số lượng Public IP</label>
           <p className="text-xs text-slate-500 mb-2">Đã bao gồm 1 IP trong giá gói.</p>
           <NumberInput value={ips} onChange={setIps} min={1} />
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
           <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
             <Plus className="w-4 h-4" />
             Thêm
           </button>
        </div>
      </div>
    </div>
  );
}
