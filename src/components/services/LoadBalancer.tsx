import { useState } from 'react';
import { PRICING } from '../../config/pricing';
import type { CartItem } from '../../types';
import { Plus } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { formatCurrency } from '../../utils/format';

interface Props {
  onAdd: (item: CartItem) => void;
}

export default function LoadBalancer({ onAdd }: Props) {
  const [selectedId, setSelectedId] = useState<string>(PRICING.loadBalancer[0].id);
  const [quantity, setQuantity] = useState<number | string>(1);
  const parsedQuantity = Math.max(1, Number(quantity) || 1);

  const selectedPkg = PRICING.loadBalancer.find(p => p.id === selectedId);

  const calculatePrice = () => {
    return selectedPkg?.price || 0;
  };

  const handleAdd = () => {
    if (!selectedPkg) return;

    onAdd({
      id: crypto.randomUUID(),
      serviceId: 'lb',
      serviceName: 'Cân bằng tải (Load Balancer)',
      description: `Gói: ${selectedPkg.name}\n- Băng thông: 500Mbps\n- Data transfer: 5000GB`,
      quantity: parsedQuantity,
      monthlyPrice: calculatePrice()
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Cấu hình Load Balancer</h3>
      <p className="text-sm text-slate-500 mb-6">Tất cả các gói đều có sẵn 500Mbps & 5000GB Data transfer.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRICING.loadBalancer.map(pkg => (
          <div
            key={pkg.id}
            onClick={() => setSelectedId(pkg.id)}
            className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${
              selectedId === pkg.id 
                ? 'border-blue-600 bg-blue-50' 
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <h4 className="font-semibold text-slate-800 text-lg mb-2">{pkg.name}</h4>
            <p className="font-bold text-blue-600">{formatCurrency(pkg.price)}</p>
            <p className="text-xs text-slate-500 mt-1">/ tháng</p>
          </div>
        ))}
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
