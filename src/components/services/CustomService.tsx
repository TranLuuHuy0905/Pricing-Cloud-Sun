import { useState } from 'react';
import type { CartItem } from '../../types';
import { Plus } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { formatCurrency } from '../../utils/format';

interface Props {
  onAdd: (item: CartItem) => void;
}

export default function CustomService({ onAdd }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>(0);
  const [quantity, setQuantity] = useState<number | string>(1);

  const parsedPrice = Number(price) || 0;
  const parsedQuantity = Math.max(1, Number(quantity) || 1);

  const handleAdd = () => {
    if (!name.trim()) return;

    onAdd({
      id: crypto.randomUUID(),
      serviceId: 'custom',
      serviceName: name,
      description: description || 'Sản phẩm / Dịch vụ bổ sung',
      quantity: parsedQuantity,
      monthlyPrice: parsedPrice
    });

    setName('');
    setDescription('');
    setPrice(0);
    setQuantity(1);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Thêm Dịch vụ / License khác</h3>
      <p className="text-sm text-slate-500 mb-6">Bạn có thể thêm license phần mềm, phí dịch vụ cài đặt hoặc các phụ phí khác vào báo giá.</p>
      
      <div className="space-y-4 max-w-xl">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Tên dịch vụ / Sản phẩm <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: License cPanel, Phí cài đặt..." className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Mô tả thêm (Tùy chọn)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Chi tiết sản phẩm / dịch vụ..." rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Đơn giá (VNĐ/tháng)</label>
          <NumberInput value={price} onChange={setPrice} min={0} step={10000} placeholder="0" />
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
             <p className="text-lg font-bold text-blue-600">{formatCurrency(parsedPrice * parsedQuantity)}</p>
           </div>
           <button onClick={handleAdd} disabled={!name.trim()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
             <Plus className="w-4 h-4" />
             Thêm
           </button>
        </div>
      </div>
    </div>
  );
}
