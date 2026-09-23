import React, { useState, useEffect } from 'react';
import type { CartItem } from '../types';
import { PRICING } from '../config/pricing';
import { 
  X, 
  Check, 
  FileEdit, 
  Calculator, 
  Cpu, 
  HardDrive, 
  Globe, 
  Layers, 
  Server, 
  ShieldCheck, 
  RotateCcw
} from 'lucide-react';
import { NumberInput } from './ui/NumberInput';
import { formatCurrency } from '../utils/format';
import { 
  parseVmCustomConfig, 
  calculateVmCustomPrice, 
  formatVmCustomDescription, 
  VmCustomConfig,
  HOURS_PER_MONTH
} from '../utils/pricingCalculator';

interface Props {
  item: CartItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CartItem) => void;
}

export default function EditItemModal({ item, isOpen, onClose, onSave }: Props) {
  const [serviceName, setServiceName] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [manualPrice, setManualPrice] = useState<number | string>(0);
  const [customNotes, setCustomNotes] = useState('');

  // VM Custom states
  const [vmConfig, setVmConfig] = useState<VmCustomConfig>(() => parseVmCustomConfig(''));

  // VM Package states
  const [pkgTier, setPkgTier] = useState<'standard' | 'premium'>('standard');
  const [pkgId, setPkgId] = useState<string>('');

  // S3 states
  const [s3Tier, setS3Tier] = useState<'hot' | 'cold'>('hot');
  const [s3Size, setS3Size] = useState<number | string>(100);

  // Database states
  const [dbPkgId, setDbPkgId] = useState<string>('');
  const [dbIps, setDbIps] = useState<number | string>(1);

  // Load Balancer states
  const [lbPkgId, setLbPkgId] = useState<string>('');

  // Kubernetes states
  const [k8sCpTier, setK8sCpTier] = useState<keyof typeof PRICING.k8s.controlPlane>('standard');
  const [k8sNodeTier, setK8sNodeTier] = useState<'standard' | 'premium'>('standard');
  const [k8sCpu, setK8sCpu] = useState<number | string>(2);
  const [k8sRam, setK8sRam] = useState<number | string>(4);
  const [k8sNodeCount, setK8sNodeCount] = useState<number | string>(3);
  const [k8sIops, setK8sIops] = useState<number>(3000);
  const [k8sDiskSize, setK8sDiskSize] = useState<number | string>(50);
  const [k8sAddonMonitor, setK8sAddonMonitor] = useState(false);
  const [k8sAddonDashboard, setK8sAddonDashboard] = useState(false);
  const [k8sAddonNginx, setK8sAddonNginx] = useState(false);
  const [k8sAddonBastion, setK8sAddonBastion] = useState(false);
  const [k8sAddonLb, setK8sAddonLb] = useState(false);

  // Custom service fallback states
  const [customDesc, setCustomDesc] = useState('');

  useEffect(() => {
    if (item) {
      setServiceName(item.serviceName);
      setQuantity(item.quantity);
      setManualPrice(item.monthlyPrice);
      setCustomNotes('');

      // Initialize service-specific config
      if (item.serviceId === 'vmCustom') {
        const parsed = parseVmCustomConfig(item.description, item.configData);
        setVmConfig(parsed);
      } else if (item.serviceId === 'vmPackage') {
        const tier = item.configData?.tier || (/premium/i.test(item.description) ? 'premium' : 'standard');
        setPkgTier(tier);
        const pkgList = PRICING.vmPackages[tier as 'standard' | 'premium'];
        const matched = pkgList.find(p => item.description.includes(p.name)) || pkgList[0];
        setPkgId(item.configData?.selectedPackageId || matched?.id || pkgList[0]?.id || '');
      } else if (item.serviceId === 's3') {
        const tier = item.configData?.tier || (/cold/i.test(item.description) ? 'cold' : 'hot');
        setS3Tier(tier);
        const sizeMatch = item.description.match(/(\d+)\s*GB/i);
        setS3Size(item.configData?.size || (sizeMatch ? parseInt(sizeMatch[1], 10) : 100));
      } else if (item.serviceId === 'database') {
        const matched = PRICING.database.find(p => item.description.includes(p.name)) || PRICING.database[0];
        setDbPkgId(item.configData?.selectedId || matched.id);
        const ipMatch = item.description.match(/(\d+)\s*IP/i);
        setDbIps(item.configData?.ips || (ipMatch ? parseInt(ipMatch[1], 10) : 1));
      } else if (item.serviceId === 'lb') {
        const matched = PRICING.loadBalancer.find(p => item.description.includes(p.name)) || PRICING.loadBalancer[0];
        setLbPkgId(item.configData?.selectedId || matched.id);
      } else if (item.serviceId === 'k8s') {
        if (item.configData) {
          setK8sCpTier(item.configData.cpTier || 'standard');
          setK8sNodeTier(item.configData.nodeTier || 'standard');
          setK8sCpu(item.configData.cpu || 2);
          setK8sRam(item.configData.ram || 4);
          setK8sNodeCount(item.configData.nodeCount || 3);
          setK8sIops(item.configData.iops || 3000);
          setK8sDiskSize(item.configData.diskSize || 50);
          setK8sAddonMonitor(Boolean(item.configData.addonMonitor));
          setK8sAddonDashboard(Boolean(item.configData.addonDashboard));
          setK8sAddonNginx(Boolean(item.configData.addonNginx));
          setK8sAddonBastion(Boolean(item.configData.addonBastion));
          setK8sAddonLb(Boolean(item.configData.addonLb));
        }
      } else {
        setCustomDesc(item.description);
      }
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // Pricing recalculation functions
  const computeCalculatedPrice = (): { price: number; desc: string; breakdown?: Record<string, number> } => {
    if (item.serviceId === 'vmCustom') {
      const calc = calculateVmCustomPrice(vmConfig);
      const desc = formatVmCustomDescription(vmConfig) + (customNotes ? `\n- Ghi chú: ${customNotes}` : '');
      return { price: calc.total, desc, breakdown: calc.breakdown };
    }

    if (item.serviceId === 'vmPackage') {
      const pkgList = PRICING.vmPackages[pkgTier];
      const pkg = pkgList.find(p => p.id === pkgId) || pkgList[0];
      const price = pkg?.price || 0;
      const desc = `Gói: ${pkgTier.toUpperCase()} - ${pkg?.group || 'TIÊU CHUẨN'}\n- Cấu hình: ${pkg?.name || ''}\n- System Disk: 20GB HDD IOPS 400${customNotes ? `\n- Ghi chú: ${customNotes}` : ''}`;
      return { price, desc };
    }

    if (item.serviceId === 's3') {
      const parsedSize = Math.max(PRICING.s3.minGB, Number(s3Size) || PRICING.s3.minGB);
      const unitPrice = PRICING.s3[s3Tier];
      const price = parsedSize * unitPrice;
      const desc = `Loại: ${s3Tier === 'hot' ? 'Hot Storage' : 'Cold Storage'} (${formatCurrency(unitPrice)}/GB)\n- Dung lượng: ${parsedSize} GB${customNotes ? `\n- Ghi chú: ${customNotes}` : ''}`;
      return { price, desc };
    }

    if (item.serviceId === 'database') {
      const pkg = PRICING.database.find(p => p.id === dbPkgId) || PRICING.database[0];
      const parsedIps = Math.max(1, Number(dbIps) || 1);
      const extraIpCost = parsedIps > 1 ? (parsedIps - 1) * PRICING.vmCustom.ip : 0;
      const price = pkg.price + extraIpCost;
      const desc = `Gói: ${pkg.group}\n- Cấu hình: ${pkg.name}\n- Số lượng IP: ${parsedIps}${customNotes ? `\n- Ghi chú: ${customNotes}` : ''}`;
      return { price, desc };
    }

    if (item.serviceId === 'lb') {
      const pkg = PRICING.loadBalancer.find(p => p.id === lbPkgId) || PRICING.loadBalancer[0];
      const price = pkg.price;
      const desc = `Gói: ${pkg.name}\n- Băng thông: 500Mbps\n- Data transfer: 5000GB${customNotes ? `\n- Ghi chú: ${customNotes}` : ''}`;
      return { price, desc };
    }

    if (item.serviceId === 'vpc') {
      const price = PRICING.vpc.price;
      const desc = `Gói cước đồng giá cho mỗi VPC${customNotes ? `\n- Ghi chú: ${customNotes}` : ''}`;
      return { price, desc };
    }

    if (item.serviceId === 'k8s') {
      const parsedCpu = Number(k8sCpu) || 1;
      const parsedRam = Number(k8sRam) || 1;
      const parsedNodeCount = Number(k8sNodeCount) || 1;
      const parsedDiskSize = Number(k8sDiskSize) || 0;

      let hourlyTotal = PRICING.k8s.controlPlane[k8sCpTier];
      const nodeParam = PRICING.k8s.node[k8sNodeTier];
      const singleNodeHourlyCost = (nodeParam.cpu * parsedCpu) + (nodeParam.ram * parsedRam);
      hourlyTotal += singleNodeHourlyCost * parsedNodeCount;

      const diskHourlyPerGB = PRICING.k8s.nodeSsd[k8sIops as keyof typeof PRICING.k8s.nodeSsd] || 3.5;
      hourlyTotal += (diskHourlyPerGB * parsedDiskSize) * parsedNodeCount;

      if (k8sAddonMonitor) hourlyTotal += PRICING.k8s.addons.monitor * parsedNodeCount;
      if (k8sAddonDashboard) hourlyTotal += PRICING.k8s.addons.dashboard;
      if (k8sAddonNginx) hourlyTotal += PRICING.k8s.addons.others;
      if (k8sAddonBastion) hourlyTotal += PRICING.k8s.addons.others;
      if (k8sAddonLb) hourlyTotal += PRICING.k8s.addons.others;

      const price = Math.round(hourlyTotal * HOURS_PER_MONTH);
      let desc = `Control Plane: ${k8sCpTier.toUpperCase()}\n`;
      desc += `Worker Nodes (${parsedNodeCount}): ${k8sNodeTier.toUpperCase()} (${parsedCpu}C/${parsedRam}G)\n`;
      desc += `Node Storage: ${parsedDiskSize}GB SSD IOPS ${k8sIops}`;
      const addons = [];
      if (k8sAddonMonitor) addons.push('Monitor');
      if (k8sAddonDashboard) addons.push('Dashboard');
      if (k8sAddonNginx) addons.push('NGINX Ingress');
      if (k8sAddonBastion) addons.push('Bastion');
      if (k8sAddonLb) addons.push('LB Auth');
      if (addons.length > 0) desc += `\nAdd-ons: ${addons.join(', ')}`;
      if (customNotes) desc += `\n- Ghi chú: ${customNotes}`;

      return { price, desc };
    }

    // Default / custom fallback
    return {
      price: Math.max(0, Number(manualPrice) || 0),
      desc: customDesc + (customNotes ? `\n- Ghi chú: ${customNotes}` : ''),
    };
  };

  const calculatedInfo = computeCalculatedPrice();
  // Strictly enforce fixed pricing mode (manual override toggle temporarily hidden as requested)
  const effectiveMonthlyPrice = calculatedInfo.price;

  const parsedQty = Math.max(1, Number(quantity) || 1);
  const totalItemCost = parsedQty * effectiveMonthlyPrice;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    // Build updated configData
    let updatedConfigData: any = {};
    if (item.serviceId === 'vmCustom') {
      updatedConfigData = { ...vmConfig };
    } else if (item.serviceId === 'vmPackage') {
      updatedConfigData = { tier: pkgTier, selectedPackageId: pkgId };
    } else if (item.serviceId === 's3') {
      updatedConfigData = { tier: s3Tier, size: Math.max(PRICING.s3.minGB, Number(s3Size) || 100) };
    } else if (item.serviceId === 'database') {
      updatedConfigData = { selectedId: dbPkgId, ips: Number(dbIps) || 1 };
    } else if (item.serviceId === 'lb') {
      updatedConfigData = { selectedId: lbPkgId };
    } else if (item.serviceId === 'k8s') {
      updatedConfigData = {
        cpTier: k8sCpTier,
        nodeTier: k8sNodeTier,
        cpu: Number(k8sCpu) || 1,
        ram: Number(k8sRam) || 1,
        nodeCount: Number(k8sNodeCount) || 1,
        iops: k8sIops,
        diskSize: Number(k8sDiskSize) || 0,
        addonMonitor: k8sAddonMonitor,
        addonDashboard: k8sAddonDashboard,
        addonNginx: k8sAddonNginx,
        addonBastion: k8sAddonBastion,
        addonLb: k8sAddonLb,
      };
    }

    onSave({
      ...item,
      serviceName: serviceName.trim(),
      description: calculatedInfo.desc,
      quantity: parsedQty,
      monthlyPrice: effectiveMonthlyPrice,
      configData: updatedConfigData,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shadow-2xs">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">Chỉnh sửa thông số cấu hình</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {item.serviceId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Giá tự động tính toán chính xác theo từng thông số CPU, RAM, Disk, IP...</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Service Name & Quantity row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Tên hiển thị dịch vụ / Máy chủ
              </label>
              <input 
                type="text"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="VD: Máy chủ Web chính, DB Production..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 font-medium"
              />
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Số lượng
              </label>
              <NumberInput 
                value={quantity}
                onChange={setQuantity}
                min={1}
                step={1}
              />
            </div>
          </div>

          {/* MAIN DYNAMIC PARAMETERS SECTION */}
          <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 sm:p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-800">
                Thông số chi tiết cấu hình
              </h4>
            </div>

            {/* 1. VM CUSTOM EDITOR */}
            {item.serviceId === 'vmCustom' && (
              <div className="space-y-4">
                {/* Tier Choice */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Gói Năng lực (Tier)</span>
                    <span className="text-xs text-slate-500">
                      Standard (CPU 75k / RAM 80k) &bull; Premium (CPU 108k / RAM 118k)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVmConfig({ ...vmConfig, tier: 'standard' })}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        vmConfig.tier === 'standard'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setVmConfig({ ...vmConfig, tier: 'premium' })}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        vmConfig.tier === 'premium'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Premium
                    </button>
                  </div>
                </div>

                {/* CPU & RAM Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CPU */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Cpu className="w-4 h-4 text-blue-600" />
                        <span>Số lượng vCPU</span>
                      </label>
                      <span className="text-[11px] font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {formatCurrency(PRICING.vmCustom[vmConfig.tier].cpu)}/core
                      </span>
                    </div>
                    <NumberInput 
                      value={vmConfig.cpu} 
                      onChange={(v) => setVmConfig({ ...vmConfig, cpu: Math.max(1, Number(v) || 1) })} 
                      min={1} 
                    />
                    <div className="text-right text-[11px] text-slate-500 font-mono">
                      = {formatCurrency(vmConfig.cpu * PRICING.vmCustom[vmConfig.tier].cpu)} / tháng
                    </div>
                  </div>

                  {/* RAM */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Server className="w-4 h-4 text-blue-600" />
                        <span>Dung lượng RAM (GB)</span>
                      </label>
                      <span className="text-[11px] font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {formatCurrency(PRICING.vmCustom[vmConfig.tier].ram)}/GB
                      </span>
                    </div>
                    <NumberInput 
                      value={vmConfig.ram} 
                      onChange={(v) => setVmConfig({ ...vmConfig, ram: Math.max(1, Number(v) || 1) })} 
                      min={1} 
                    />
                    <div className="text-right text-[11px] text-slate-500 font-mono">
                      = {formatCurrency(vmConfig.ram * PRICING.vmCustom[vmConfig.tier].ram)} / tháng
                    </div>
                  </div>
                </div>

                {/* STORAGE: SYSTEM DISK & DATA DISK */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <HardDrive className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cấu hình Ổ cứng (Storage)</span>
                  </div>

                  {/* System Disk */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">System Disk (Ổ hệ điều hành)</span>
                      {vmConfig.sysDiskSize > 0 && (
                        <span className="text-[11px] font-mono font-semibold text-indigo-600">
                          {formatCurrency(
                            vmConfig.sysDiskSize * (
                              vmConfig.sysDiskType === 'hdd'
                                ? (PRICING.vmCustom.hdd[vmConfig.sysIops as keyof typeof PRICING.vmCustom.hdd] || 1200)
                                : (PRICING.vmCustom.ssd[vmConfig.sysIops as keyof typeof PRICING.vmCustom.ssd] || 3200)
                            )
                          )}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <select 
                          value={vmConfig.sysDiskType} 
                          onChange={(e) => {
                            const val = e.target.value as 'hdd' | 'ssd';
                            setVmConfig({
                              ...vmConfig,
                              sysDiskType: val,
                              sysIops: val === 'hdd' ? 400 : 3000,
                            });
                          }} 
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        >
                          <option value="hdd">HDD (1.000 ~ 1.500 đ/GB)</option>
                          <option value="ssd">SSD (2.700 ~ 11.000 đ/GB)</option>
                        </select>
                      </div>

                      <div>
                        <select 
                          value={vmConfig.sysIops} 
                          onChange={(e) => setVmConfig({ ...vmConfig, sysIops: Number(e.target.value) })} 
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        >
                          {vmConfig.sysDiskType === 'hdd'
                            ? Object.entries(PRICING.vmCustom.hdd).map(([k, v]) => (
                                <option key={k} value={k}>{k} IOPS ({formatCurrency(v)}/GB)</option>
                              ))
                            : Object.entries(PRICING.vmCustom.ssd).map(([k, v]) => (
                                <option key={k} value={k}>{k} IOPS ({formatCurrency(v)}/GB)</option>
                              ))
                          }
                        </select>
                      </div>

                      <div>
                        <NumberInput 
                          value={vmConfig.sysDiskSize} 
                          onChange={(v) => setVmConfig({ ...vmConfig, sysDiskSize: Math.max(0, Number(v) || 0) })} 
                          step={10} 
                          placeholder="Dung lượng GB"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Data Disk */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Data Disk (Ổ dữ liệu phụ)</span>
                      {vmConfig.dataDiskSize > 0 && (
                        <span className="text-[11px] font-mono font-semibold text-indigo-600">
                          {formatCurrency(
                            vmConfig.dataDiskSize * (
                              vmConfig.dataDiskType === 'hdd'
                                ? (PRICING.vmCustom.hdd[vmConfig.dataIops as keyof typeof PRICING.vmCustom.hdd] || 1200)
                                : (PRICING.vmCustom.ssd[vmConfig.dataIops as keyof typeof PRICING.vmCustom.ssd] || 3200)
                            )
                          )}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <select 
                          value={vmConfig.dataDiskType} 
                          onChange={(e) => {
                            const val = e.target.value as 'hdd' | 'ssd';
                            setVmConfig({
                              ...vmConfig,
                              dataDiskType: val,
                              dataIops: val === 'hdd' ? 400 : 3000,
                            });
                          }} 
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        >
                          <option value="hdd">HDD</option>
                          <option value="ssd">SSD</option>
                        </select>
                      </div>

                      <div>
                        <select 
                          value={vmConfig.dataIops} 
                          onChange={(e) => setVmConfig({ ...vmConfig, dataIops: Number(e.target.value) })} 
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        >
                          {vmConfig.dataDiskType === 'hdd'
                            ? Object.entries(PRICING.vmCustom.hdd).map(([k, v]) => (
                                <option key={k} value={k}>{k} IOPS ({formatCurrency(v)}/GB)</option>
                              ))
                            : Object.entries(PRICING.vmCustom.ssd).map(([k, v]) => (
                                <option key={k} value={k}>{k} IOPS ({formatCurrency(v)}/GB)</option>
                              ))
                          }
                        </select>
                      </div>

                      <div>
                        <NumberInput 
                          value={vmConfig.dataDiskSize} 
                          onChange={(v) => setVmConfig({ ...vmConfig, dataDiskSize: Math.max(0, Number(v) || 0) })} 
                          step={10} 
                          placeholder="Dung lượng GB"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* IP & BACKUP ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                        <span>Public IP</span>
                      </label>
                      <span className="text-[10px] text-slate-400">100k/IP</span>
                    </div>
                    <NumberInput 
                      value={vmConfig.ips} 
                      onChange={(v) => setVmConfig({ ...vmConfig, ips: Math.max(0, Number(v) || 0) })} 
                      min={0} 
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Backup (GB)</span>
                      </label>
                      <span className="text-[10px] text-slate-400">~1.015đ/GB</span>
                    </div>
                    <NumberInput 
                      value={vmConfig.backupGB} 
                      onChange={(v) => setVmConfig({ ...vmConfig, backupGB: Math.max(0, Number(v) || 0) })} 
                      step={10} 
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Snapshot (GB)</span>
                      </label>
                      <span className="text-[10px] text-slate-400">~1.460đ/GB</span>
                    </div>
                    <NumberInput 
                      value={vmConfig.snapshotGB} 
                      onChange={(v) => setVmConfig({ ...vmConfig, snapshotGB: Math.max(0, Number(v) || 0) })} 
                      step={10} 
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Price Breakdown Badge */}
                {calculatedInfo.breakdown && (
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs space-y-1.5 font-sans">
                    <div className="font-semibold text-blue-900 flex items-center justify-between">
                      <span>Bảng phân bổ chi phí chi tiết:</span>
                      <span className="font-bold text-blue-700">{formatCurrency(calculatedInfo.price)}/tháng</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 text-[11px] pt-1">
                      <div>vCPU: <span className="font-semibold text-slate-800">{formatCurrency(calculatedInfo.breakdown.cpuCost)}</span></div>
                      <div>RAM: <span className="font-semibold text-slate-800">{formatCurrency(calculatedInfo.breakdown.ramCost)}</span></div>
                      <div>System Disk: <span className="font-semibold text-slate-800">{formatCurrency(calculatedInfo.breakdown.sysDiskCost)}</span></div>
                      <div>Data Disk: <span className="font-semibold text-slate-800">{formatCurrency(calculatedInfo.breakdown.dataDiskCost)}</span></div>
                      {calculatedInfo.breakdown.ipCost > 0 && <div>Public IP: <span className="font-semibold text-slate-800">{formatCurrency(calculatedInfo.breakdown.ipCost)}</span></div>}
                      {calculatedInfo.breakdown.backupCost > 0 && <div>Backup: <span className="font-semibold text-slate-800">{formatCurrency(calculatedInfo.breakdown.backupCost)}</span></div>}
                      {calculatedInfo.breakdown.snapshotCost > 0 && <div>Snapshot: <span className="font-semibold text-slate-800">{formatCurrency(calculatedInfo.breakdown.snapshotCost)}</span></div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. VM PACKAGE EDITOR */}
            {item.serviceId === 'vmPackage' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Hạng dịch vụ:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPkgTier('standard')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                        pkgTier === 'standard' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setPkgTier('premium')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                        pkgTier === 'premium' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'
                      }`}
                    >
                      Premium
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Chọn gói cấu hình có sẵn</label>
                  <select
                    value={pkgId}
                    onChange={(e) => setPkgId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  >
                    {PRICING.vmPackages[pkgTier].map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.group} &bull; {p.name} — {formatCurrency(p.price)}/tháng
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 3. S3 STORAGE EDITOR */}
            {item.serviceId === 's3' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setS3Tier('hot')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      s3Tier === 'hot' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-800">Hot Storage</div>
                    <div className="text-xs font-semibold text-blue-600 mt-1">{formatCurrency(PRICING.s3.hot)}/GB</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setS3Tier('cold')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      s3Tier === 'cold' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-800">Cold Storage</div>
                    <div className="text-xs font-semibold text-blue-600 mt-1">{formatCurrency(PRICING.s3.cold)}/GB</div>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Dung lượng lưu trữ (GB, tối thiểu 100GB)</label>
                  <NumberInput 
                    value={s3Size} 
                    onChange={setS3Size} 
                    min={PRICING.s3.minGB} 
                    step={50} 
                  />
                  <div className="text-right text-xs text-slate-500">
                    = {formatCurrency(Math.max(PRICING.s3.minGB, Number(s3Size) || 100) * PRICING.s3[s3Tier])} / tháng
                  </div>
                </div>
              </div>
            )}

            {/* 4. DATABASE SERVICE EDITOR */}
            {item.serviceId === 'database' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Gói cấu hình Database</label>
                  <select
                    value={dbPkgId}
                    onChange={(e) => setDbPkgId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {PRICING.database.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.group} &bull; {p.name} — {formatCurrency(p.price)}/tháng
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Số lượng IP (Đã gồm 1 IP, thêm +100k/IP)</label>
                  <NumberInput value={dbIps} onChange={setDbIps} min={1} />
                </div>
              </div>
            )}

            {/* 5. LOAD BALANCER EDITOR */}
            {item.serviceId === 'lb' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Chọn gói Load Balancer</label>
                <div className="grid grid-cols-3 gap-3">
                  {PRICING.loadBalancer.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLbPkgId(p.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        lbPkgId === p.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-800">{p.name}</div>
                      <div className="text-xs font-semibold text-blue-600 mt-1">{formatCurrency(p.price)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. KUBERNETES EDITOR */}
            {item.serviceId === 'k8s' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Control Plane</label>
                    <select
                      value={k8sCpTier}
                      onChange={(e) => setK8sCpTier(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      {Object.keys(PRICING.k8s.controlPlane).map(k => (
                        <option key={k} value={k}>{k.toUpperCase()} ({PRICING.k8s.controlPlane[k as keyof typeof PRICING.k8s.controlPlane]}đ/h)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Node</label>
                    <select
                      value={k8sNodeTier}
                      onChange={(e) => setK8sNodeTier(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">vCPU/Node</label>
                    <NumberInput value={k8sCpu} onChange={setK8sCpu} min={1} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">RAM/Node (GB)</label>
                    <NumberInput value={k8sRam} onChange={setK8sRam} min={1} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Số Nodes</label>
                    <NumberInput value={k8sNodeCount} onChange={setK8sNodeCount} min={1} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Mức IOPS (SSD)</label>
                    <select
                      value={k8sIops}
                      onChange={(e) => setK8sIops(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      {Object.keys(PRICING.k8s.nodeSsd).map(k => (
                        <option key={k} value={k}>{k} IOPS</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Disk mỗi Node (GB)</label>
                    <NumberInput value={k8sDiskSize} onChange={setK8sDiskSize} step={10} min={10} />
                  </div>
                </div>
              </div>
            )}

            {/* 7. CUSTOM / OTHER FALLBACK */}
            {item.serviceId === 'custom' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Mô tả chi tiết cấu hình dịch vụ</label>
                <textarea
                  rows={3}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            )}

            {/* Custom service price input if serviceId is custom */}
            {item.serviceId === 'custom' && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đơn giá dịch vụ (VNĐ / tháng)
                </label>
                <NumberInput 
                  value={manualPrice} 
                  onChange={setManualPrice} 
                  step={10000} 
                  min={0} 
                />
              </div>
            )}
          </div>

          {/* Ghi chú thêm (Tùy chọn) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Ghi chú thêm cho dòng cấu hình (Tùy chọn)
            </label>
            <input 
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="VD: Cài sẵn Ubuntu 22.04 LTS, IP tĩnh Viettel, backup hàng ngày..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
            />
          </div>

          {/* Preview Mô tả hiển thị trên báo giá */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Mô tả sẽ xuất hiện trên bảng báo giá & Excel:
            </span>
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
              {calculatedInfo.desc}
            </div>
          </div>

          {/* SUMMARY CALCULATION BANNER */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-600 font-medium">
                  Đơn giá: <span className="font-bold text-slate-900">{formatCurrency(effectiveMonthlyPrice)}</span>/tháng &bull; SL: <span className="font-bold text-slate-900">{parsedQty}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Tổng thành tiền mục này</span>
              <span className="text-xl sm:text-2xl font-extrabold text-blue-700">{formatCurrency(totalItemCost)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!serviceName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Cập nhật cấu hình & Giá
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
