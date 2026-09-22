import { useState } from 'react';
import { PRICING } from '../../config/pricing';
import type { CartItem } from '../../types';
import { Plus } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { formatCurrency } from '../../utils/format';

interface Props {
  onAdd: (item: CartItem) => void;
}

export default function VPC({ onAdd }: Props) {
  const [quantity, setQuantity] = useState<number | string>(1);
  const parsedQuantity = Math.max(1, Number(quantity) || 1);

  const calculatePrice = () => {
    return PRICING.vpc.price;
  }

  const handleAdd = () => {
    onAdd({
      id: crypto.randomUUID(),
      serviceId: 'vpc',
      serviceName: 'Mạng riêng ảo (VPC)',
      description: `Gói cước đồng giá cho mỗi VPC`,
      quantity: parsedQuantity,
      monthlyPrice: calculatePrice()
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Cấu hình Mạng riêng ảo (VPC)</h3>
      
      <div className="space-y-5">
        <div className="p-6 border-2 border-blue-600 bg-blue-50 rounded-xl max-w-lg">
           <h4 className="text-lg font-bold text-slate-800 mb-2">Gói VPC Tiêu chuẩn</h4>
           <div className="space-y-2 mt-4 text-sm text-slate-600">
             <p>✓ Cung cấp mạng nội bộ ảo và an toàn</p>
             <p>✓ Quản lý Subnet, Routing table linh hoạt</p>
             <p>✓ Hỗ trợ VPN Site-to-Site</p>
           </div>
           <p className="text-xl font-bold text-blue-600 mt-6">{formatCurrency(PRICING.vpc.price)} / tháng</p>
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
           <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
             <Plus className="w-4 h-4" />
             Thêm
           </button>
        </div>
      </div>
    </div>
  );
}
