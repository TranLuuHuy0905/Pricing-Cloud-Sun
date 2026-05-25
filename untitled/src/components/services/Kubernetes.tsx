import { useState } from 'react';
import { PRICING } from '../../config/pricing';
import type { CartItem } from '../../types';
import { Plus } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { formatCurrency } from '../../utils/format';

interface Props {
  onAdd: (item: CartItem) => void;
}

const HOURS_PER_MONTH = 730;

export default function Kubernetes({ onAdd }: Props) {
  const [cpTier, setCpTier] = useState<keyof typeof PRICING.k8s.controlPlane>('standard');
  const [nodeTier, setNodeTier] = useState<'standard' | 'premium'>('standard');
  const [cpu, setCpu] = useState<number | string>(2);
  const [ram, setRam] = useState<number | string>(4);
  const [nodeCount, setNodeCount] = useState<number | string>(3);
  
  const [iops, setIops] = useState<number>(3000);
  const [diskSize, setDiskSize] = useState<number | string>(50); // GB per node

  // Addons
  const [addonMonitor, setAddonMonitor] = useState(false);
  const [addonDashboard, setAddonDashboard] = useState(false);
  const [addonNginx, setAddonNginx] = useState(false);
  const [addonBastion, setAddonBastion] = useState(false);
  const [addonLb, setAddonLb] = useState(false);

  const parsedCpu = Number(cpu) || 0;
  const parsedRam = Number(ram) || 0;
  const parsedNodeCount = Number(nodeCount) || 0;
  const parsedDiskSize = Number(diskSize) || 0;

  const calculatePrice = () => {
    let hourlyTotal = 0;
    
    // Control plane
    hourlyTotal += PRICING.k8s.controlPlane[cpTier];
    
    // Node cost
    const nodeParam = PRICING.k8s.node[nodeTier];
    const singleNodeHourlyCost = (nodeParam.cpu * parsedCpu) + (nodeParam.ram * parsedRam);
    hourlyTotal += singleNodeHourlyCost * parsedNodeCount;

    // Node Disk cost
    const diskHourlyPerGB = PRICING.k8s.nodeSsd[iops as keyof typeof PRICING.k8s.nodeSsd] || 0;
    hourlyTotal += (diskHourlyPerGB * parsedDiskSize) * parsedNodeCount;

    // Addons
    if (addonMonitor) hourlyTotal += PRICING.k8s.addons.monitor * parsedNodeCount;
    if (addonDashboard) hourlyTotal += PRICING.k8s.addons.dashboard;
    if (addonNginx) hourlyTotal += PRICING.k8s.addons.others;
    if (addonBastion) hourlyTotal += PRICING.k8s.addons.others;
    if (addonLb) hourlyTotal += PRICING.k8s.addons.others;

    return hourlyTotal * HOURS_PER_MONTH;
  };

  const handleAdd = () => {
    let dsc = `Control Plane: ${cpTier.toUpperCase()}\n`;
    dsc += `Worker Nodes (${parsedNodeCount}): ${nodeTier.toUpperCase()} (${parsedCpu}C/${parsedRam}G)\n`;
    dsc += `Node Storage: ${parsedDiskSize}GB SSD IOPS ${iops}`;
    
    let addons = [];
    if (addonMonitor) addons.push('Monitor');
    if (addonDashboard) addons.push('Dashboard');
    if (addonNginx) addons.push('NGINX Ingress');
    if (addonBastion) addons.push('Bastion');
    if (addonLb) addons.push('LB Auth');
    
    if (addons.length > 0) dsc += `\nAdd-ons: ${addons.join(', ')}`;

    onAdd({
      id: crypto.randomUUID(),
      serviceId: 'k8s',
      serviceName: 'Kubernetes Service (K8S)',
      description: dsc,
      quantity: 1,
      monthlyPrice: calculatePrice()
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Cấu hình Kubernetes (K8S)</h3>
      
      <div className="space-y-6">
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-3">Control Plane Tier</label>
           <div className="flex flex-wrap gap-4">
             {Object.keys(PRICING.k8s.controlPlane).map(tier => (
               <label key={tier} className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" className="w-4 h-4 text-blue-600 focus:ring-blue-500" checked={cpTier === tier} onChange={() => setCpTier(tier as any)} />
                 <span className="text-sm capitalize">{tier} ({PRICING.k8s.controlPlane[tier as keyof typeof PRICING.k8s.controlPlane]} VNĐ/h)</span>
               </label>
             ))}
           </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
           <h4 className="text-sm font-semibold text-slate-800 mb-4">Worker Nodes</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                 <label className="block text-sm font-medium text-slate-700">Loại Node</label>
                 <select value={nodeTier} onChange={e => setNodeTier(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="block text-sm font-medium text-slate-700">Số lượng vCPU/Node</label>
                 <NumberInput value={cpu} onChange={setCpu} min={1} />
              </div>
              <div className="space-y-2">
                 <label className="block text-sm font-medium text-slate-700">Dung lượng RAM/Node (GB)</label>
                 <NumberInput value={ram} onChange={setRam} min={1} />
              </div>
              <div className="space-y-2">
                 <label className="block text-sm font-medium text-slate-700">Số lượng Nodes</label>
                 <NumberInput value={nodeCount} onChange={setNodeCount} min={1} />
              </div>
           </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
           <h4 className="text-sm font-semibold text-slate-800 mb-4">Node Storage (Mỗi Node)</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
             <div className="space-y-2">
                 <label className="block text-sm font-medium text-slate-700">Mức IOPS (SSD)</label>
                 <select value={iops} onChange={e => setIops(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                     {Object.keys(PRICING.k8s.nodeSsd).map(k => <option key={k} value={k}>{k}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="block text-sm font-medium text-slate-700">Dung lượng (GB)</label>
                 <NumberInput value={diskSize} onChange={setDiskSize} step={10} />
              </div>
           </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
           <h4 className="text-sm font-semibold text-slate-800 mb-4">Add-ons</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="flex items-start gap-2 cursor-pointer bg-slate-50 p-3 flex-col rounded-lg border border-slate-200">
                 <div className="flex items-center gap-2">
                   <input type="checkbox" checked={addonMonitor} onChange={e => setAddonMonitor(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                   <span className="text-sm font-medium">K8s Monitor</span>
                 </div>
                 <span className="text-xs text-slate-500 ml-6">50 VNĐ/Node/h</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer bg-slate-50 p-3 flex-col rounded-lg border border-slate-200">
                 <div className="flex items-center gap-2">
                   <input type="checkbox" checked={addonDashboard} onChange={e => setAddonDashboard(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                   <span className="text-sm font-medium">Dashboard</span>
                 </div>
                 <span className="text-xs text-slate-500 ml-6">450 VNĐ/h</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer bg-slate-50 p-3 flex-col rounded-lg border border-slate-200">
                 <div className="flex items-center gap-2">
                   <input type="checkbox" checked={addonNginx} onChange={e => setAddonNginx(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                   <span className="text-sm font-medium">NGINX Ingress</span>
                 </div>
                 <span className="text-xs text-slate-500 ml-6">608 VNĐ/h</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer bg-slate-50 p-3 flex-col rounded-lg border border-slate-200">
                 <div className="flex items-center gap-2">
                   <input type="checkbox" checked={addonBastion} onChange={e => setAddonBastion(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                   <span className="text-sm font-medium">Bastion</span>
                 </div>
                 <span className="text-xs text-slate-500 ml-6">608 VNĐ/h</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer bg-slate-50 p-3 flex-col rounded-lg border border-slate-200">
                 <div className="flex items-center gap-2">
                   <input type="checkbox" checked={addonLb} onChange={e => setAddonLb(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                   <span className="text-sm font-medium">LB Integration</span>
                 </div>
                 <span className="text-xs text-slate-500 ml-6">608 VNĐ/h</span>
              </label>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-end p-4 bg-slate-50 rounded-lg border border-slate-200 mt-8">
        <div className="flex items-center gap-6">
           <div className="text-right">
             <p className="text-xs text-slate-500">Tạm tính (chưa VAT) cho 730 giờ</p>
             <p className="text-lg font-bold text-blue-600">{formatCurrency(calculatePrice())}/tháng</p>
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
