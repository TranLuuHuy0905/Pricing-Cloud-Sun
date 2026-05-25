import { useState } from 'react';
import { PRICING } from '../../config/pricing';
import type { CartItem } from '../../types';
import { Plus } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { formatCurrency } from '../../utils/format';

interface Props {
  onAdd: (item: CartItem) => void;
}

export default function VMCustom({ onAdd }: Props) {
  const [tier, setTier] = useState<'standard' | 'premium'>('standard');
  const [cpu, setCpu] = useState<number | string>(1);
  const [ram, setRam] = useState<number | string>(1);
  const [ips, setIps] = useState<number | string>(0);

  // System Disk
  const [sysDiskType, setSysDiskType] = useState<'hdd' | 'ssd'>('hdd');
  const [sysIops, setSysIops] = useState<number>(400);
  const [sysDiskSize, setSysDiskSize] = useState<number | string>(0);

  // Data Disk
  const [dataDiskType, setDataDiskType] = useState<'hdd' | 'ssd'>('hdd');
  const [dataIops, setDataIops] = useState<number>(400);
  const [dataDiskSize, setDataDiskSize] = useState<number | string>(0);

  const [quantity, setQuantity] = useState<number | string>(1);

  // Hourly services (approx 730h/month)
  const HOURS_PER_MONTH = 730;
  const [backupGB, setBackupGB] = useState<number | string>(0);
  const [snapshotGB, setSnapshotGB] = useState<number | string>(0);

  const parsedCpu = Number(cpu) || 0;
  const parsedRam = Number(ram) || 0;
  const parsedIps = Number(ips) || 0;
  const parsedSysDiskSize = Number(sysDiskSize) || 0;
  const parsedDataDiskSize = Number(dataDiskSize) || 0;
  const parsedBackupGB = Number(backupGB) || 0;
  const parsedSnapshotGB = Number(snapshotGB) || 0;
  const parsedQuantity = Math.max(1, Number(quantity) || 1);

  const calculatePrice = () => {
    let total = 0;
    
    // Compute CPU / RAM
    total += parsedCpu * PRICING.vmCustom[tier].cpu;
    total += parsedRam * PRICING.vmCustom[tier].ram;
    
    // IP
    total += parsedIps * PRICING.vmCustom.ip;

    // Disk
    let sysDiskCost = 0;
    if (parsedSysDiskSize > 0) {
      if (sysDiskType === 'hdd') {
        const pricePerGB = PRICING.vmCustom.hdd[sysIops as keyof typeof PRICING.vmCustom.hdd] || 0;
        sysDiskCost = parsedSysDiskSize * pricePerGB;
      } else {
        const pricePerGB = PRICING.vmCustom.ssd[sysIops as keyof typeof PRICING.vmCustom.ssd] || 0;
        sysDiskCost = parsedSysDiskSize * pricePerGB;
      }
    }

    let dataDiskCost = 0;
    if (parsedDataDiskSize > 0) {
      if (dataDiskType === 'hdd') {
        const pricePerGB = PRICING.vmCustom.hdd[dataIops as keyof typeof PRICING.vmCustom.hdd] || 0;
        dataDiskCost = parsedDataDiskSize * pricePerGB;
      } else {
        const pricePerGB = PRICING.vmCustom.ssd[dataIops as keyof typeof PRICING.vmCustom.ssd] || 0;
        dataDiskCost = parsedDataDiskSize * pricePerGB;
      }
    }
    total += sysDiskCost + dataDiskCost;

    // Hourly Services -> Monthly
    if (parsedBackupGB > 0) total += parsedBackupGB * PRICING.vmCustom.hourly.backup * HOURS_PER_MONTH;
    if (parsedSnapshotGB > 0) total += parsedSnapshotGB * PRICING.vmCustom.hourly.snapshot * HOURS_PER_MONTH;

    return total;
  };

  const handleAdd = () => {
    const monthlyPrice = calculatePrice();
    const sysDiskStr = parsedSysDiskSize > 0 ? `\n- System Disk: ${parsedSysDiskSize}GB ${sysDiskType.toUpperCase()} (IOPS ${sysIops})` : '';
    const dataDiskStr = parsedDataDiskSize > 0 ? `\n- Data Disk: ${parsedDataDiskSize}GB ${dataDiskType.toUpperCase()} (IOPS ${dataIops})` : '';
    const ipStr = parsedIps > 0 ? `\n- Tùy chọn: ${parsedIps} IP` : '';
    const bkStr = parsedBackupGB > 0 ? `\n- Backup: ${parsedBackupGB}GB/tháng` : '';
    const snpStr = parsedSnapshotGB > 0 ? `\n- Snapshot: ${parsedSnapshotGB}GB/tháng` : '';

    onAdd({
      id: crypto.randomUUID(),
      serviceId: 'vmCustom',
      serviceName: 'Máy chủ ảo (Custom)',
      description: `Cấu hình: ${tier.toUpperCase()}\n- ${parsedCpu} vCPU, ${parsedRam}GB RAM${sysDiskStr}${dataDiskStr}${ipStr}${bkStr}${snpStr}`,
      quantity: parsedQuantity,
      monthlyPrice
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Tùy chỉnh cấu hình VM</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-3">
          <label className="block text-sm font-medium text-slate-700">Gói năng lực (Tier)</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" className="w-4 h-4 text-blue-600 focus:ring-blue-500" checked={tier === 'standard'} onChange={() => setTier('standard')} />
              <span className="text-sm">Standard</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" className="w-4 h-4 text-blue-600 focus:ring-blue-500" checked={tier === 'premium'} onChange={() => setTier('premium')} />
              <span className="text-sm">Premium</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Số lượng vCPU</label>
          <NumberInput value={cpu} onChange={setCpu} min={1} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Dung lượng RAM (GB)</label>
          <NumberInput value={ram} onChange={setRam} min={1} />
        </div>

        <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100">
           <h4 className="text-sm font-semibold text-slate-800 mb-4">Lưu trữ (Storage)</h4>
           
           <div className="space-y-6">
             {/* System Disk */}
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <h5 className="text-sm font-medium text-slate-800 mb-3">System Disk</h5>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                    <label className="block text-sm text-slate-600">Loại ổ cứng</label>
                    <select value={sysDiskType} onChange={(e) => {
                      const val = e.target.value as 'hdd' | 'ssd';
                      setSysDiskType(val);
                      setSysIops(val === 'hdd' ? 400 : 3000);
                    }} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="hdd">HDD</option>
                      <option value="ssd">SSD</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="block text-sm text-slate-600">Mức IOPS</label>
                    <select value={sysIops} onChange={(e) => setSysIops(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      {sysDiskType === 'hdd' 
                        ? Object.keys(PRICING.vmCustom.hdd).map(k => <option key={k} value={k}>{k}</option>)
                        : Object.keys(PRICING.vmCustom.ssd).map(k => <option key={k} value={k}>{k}</option>)
                      }
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="block text-sm text-slate-600">Dung lượng (GB)</label>
                    <NumberInput value={sysDiskSize} onChange={setSysDiskSize} step={10} />
                 </div>
               </div>
             </div>

             {/* Data Disk */}
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <h5 className="text-sm font-medium text-slate-800 mb-3">Data Disk</h5>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                    <label className="block text-sm text-slate-600">Loại ổ cứng</label>
                    <select value={dataDiskType} onChange={(e) => {
                      const val = e.target.value as 'hdd' | 'ssd';
                      setDataDiskType(val);
                      setDataIops(val === 'hdd' ? 400 : 3000);
                    }} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="hdd">HDD</option>
                      <option value="ssd">SSD</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="block text-sm text-slate-600">Mức IOPS</label>
                    <select value={dataIops} onChange={(e) => setDataIops(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      {dataDiskType === 'hdd' 
                        ? Object.keys(PRICING.vmCustom.hdd).map(k => <option key={k} value={k}>{k}</option>)
                        : Object.keys(PRICING.vmCustom.ssd).map(k => <option key={k} value={k}>{k}</option>)
                      }
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="block text-sm text-slate-600">Dung lượng (GB)</label>
                    <NumberInput value={dataDiskSize} onChange={setDataDiskSize} step={10} />
                 </div>
               </div>
             </div>
           </div>
        </div>

        <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100">
           <h4 className="text-sm font-semibold text-slate-800 mb-4">Bổ sung</h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Public IP</label>
                <NumberInput value={ips} onChange={setIps} />
             </div>
             <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Backup (GB/giờ)</label>
                <NumberInput value={backupGB} onChange={setBackupGB} placeholder="Dự kiến số GB" step={10} />
             </div>
             <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Snapshot (GB/giờ)</label>
                <NumberInput value={snapshotGB} onChange={setSnapshotGB} placeholder="Dự kiến số GB" step={10} />
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
           <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
             <Plus className="w-4 h-4" />
             Thêm
           </button>
        </div>
      </div>
    </div>
  );
}
