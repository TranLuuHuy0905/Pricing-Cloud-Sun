import { PRICING } from '../config/pricing';

export const HOURS_PER_MONTH = 730;

// VM Custom
export interface VmCustomConfig {
  tier: 'standard' | 'premium';
  cpu: number;
  ram: number;
  ips: number;
  sysDiskType: 'hdd' | 'ssd';
  sysIops: number;
  sysDiskSize: number;
  dataDiskType: 'hdd' | 'ssd';
  dataIops: number;
  dataDiskSize: number;
  backupGB: number;
  snapshotGB: number;
}

export function calculateVmCustomPrice(cfg: VmCustomConfig): {
  total: number;
  breakdown: {
    cpuCost: number;
    ramCost: number;
    sysDiskCost: number;
    dataDiskCost: number;
    ipCost: number;
    backupCost: number;
    snapshotCost: number;
  };
} {
  const cpuPrice = PRICING.vmCustom[cfg.tier].cpu;
  const ramPrice = PRICING.vmCustom[cfg.tier].ram;
  const cpuCost = cfg.cpu * cpuPrice;
  const ramCost = cfg.ram * ramPrice;

  const ipCost = cfg.ips * PRICING.vmCustom.ip;

  let sysDiskCost = 0;
  if (cfg.sysDiskSize > 0) {
    if (cfg.sysDiskType === 'hdd') {
      const pricePerGB = PRICING.vmCustom.hdd[cfg.sysIops as keyof typeof PRICING.vmCustom.hdd] || 1200;
      sysDiskCost = cfg.sysDiskSize * pricePerGB;
    } else {
      const pricePerGB = PRICING.vmCustom.ssd[cfg.sysIops as keyof typeof PRICING.vmCustom.ssd] || 3200;
      sysDiskCost = cfg.sysDiskSize * pricePerGB;
    }
  }

  let dataDiskCost = 0;
  if (cfg.dataDiskSize > 0) {
    if (cfg.dataDiskType === 'hdd') {
      const pricePerGB = PRICING.vmCustom.hdd[cfg.dataIops as keyof typeof PRICING.vmCustom.hdd] || 1200;
      dataDiskCost = cfg.dataDiskSize * pricePerGB;
    } else {
      const pricePerGB = PRICING.vmCustom.ssd[cfg.dataIops as keyof typeof PRICING.vmCustom.ssd] || 3200;
      dataDiskCost = cfg.dataDiskSize * pricePerGB;
    }
  }

  const backupCost = cfg.backupGB > 0 ? Math.round(cfg.backupGB * PRICING.vmCustom.hourly.backup * HOURS_PER_MONTH) : 0;
  const snapshotCost = cfg.snapshotGB > 0 ? Math.round(cfg.snapshotGB * PRICING.vmCustom.hourly.snapshot * HOURS_PER_MONTH) : 0;

  const total = cpuCost + ramCost + ipCost + sysDiskCost + dataDiskCost + backupCost + snapshotCost;

  return {
    total,
    breakdown: {
      cpuCost,
      ramCost,
      sysDiskCost,
      dataDiskCost,
      ipCost,
      backupCost,
      snapshotCost,
    },
  };
}

export function formatVmCustomDescription(cfg: VmCustomConfig): string {
  const sysDiskStr = cfg.sysDiskSize > 0 ? `\n- System Disk: ${cfg.sysDiskSize}GB ${cfg.sysDiskType.toUpperCase()} (IOPS ${cfg.sysIops})` : '';
  const dataDiskStr = cfg.dataDiskSize > 0 ? `\n- Data Disk: ${cfg.dataDiskSize}GB ${cfg.dataDiskType.toUpperCase()} (IOPS ${cfg.dataIops})` : '';
  const ipStr = cfg.ips > 0 ? `\n- Tùy chọn: ${cfg.ips} IP` : '';
  const bkStr = cfg.backupGB > 0 ? `\n- Backup: ${cfg.backupGB}GB/tháng` : '';
  const snpStr = cfg.snapshotGB > 0 ? `\n- Snapshot: ${cfg.snapshotGB}GB/tháng` : '';

  return `Cấu hình: ${cfg.tier.toUpperCase()}\n- ${cfg.cpu} vCPU, ${cfg.ram}GB RAM${sysDiskStr}${dataDiskStr}${ipStr}${bkStr}${snpStr}`;
}

export function parseVmCustomConfig(desc: string, currentConfig?: any): VmCustomConfig {
  const defaults: VmCustomConfig = {
    tier: 'standard',
    cpu: 1,
    ram: 1,
    ips: 0,
    sysDiskType: 'hdd',
    sysIops: 400,
    sysDiskSize: 0,
    dataDiskType: 'hdd',
    dataIops: 400,
    dataDiskSize: 0,
    backupGB: 0,
    snapshotGB: 0,
  };

  if (currentConfig && typeof currentConfig.cpu === 'number') {
    return { ...defaults, ...currentConfig };
  }

  // Parse from description string
  if (desc) {
    if (/premium/i.test(desc)) defaults.tier = 'premium';
    const cpuMatch = desc.match(/(\d+)\s*vCPU/i);
    if (cpuMatch) defaults.cpu = parseInt(cpuMatch[1], 10);

    const ramMatch = desc.match(/(\d+)\s*GB\s*RAM/i);
    if (ramMatch) defaults.ram = parseInt(ramMatch[1], 10);

    const sysMatch = desc.match(/System Disk:\s*(\d+)GB\s*(HDD|SSD)\s*\(IOPS\s*(\d+)\)/i);
    if (sysMatch) {
      defaults.sysDiskSize = parseInt(sysMatch[1], 10);
      defaults.sysDiskType = sysMatch[2].toLowerCase() as 'hdd' | 'ssd';
      defaults.sysIops = parseInt(sysMatch[3], 10);
    }

    const dataMatch = desc.match(/Data Disk:\s*(\d+)GB\s*(HDD|SSD)\s*\(IOPS\s*(\d+)\)/i);
    if (dataMatch) {
      defaults.dataDiskSize = parseInt(dataMatch[1], 10);
      defaults.dataDiskType = dataMatch[2].toLowerCase() as 'hdd' | 'ssd';
      defaults.dataIops = parseInt(dataMatch[3], 10);
    }

    const ipMatch = desc.match(/(\d+)\s*IP/i);
    if (ipMatch) defaults.ips = parseInt(ipMatch[1], 10);

    const bkMatch = desc.match(/Backup:\s*(\d+)GB/i);
    if (bkMatch) defaults.backupGB = parseInt(bkMatch[1], 10);

    const snpMatch = desc.match(/Snapshot:\s*(\d+)GB/i);
    if (snpMatch) defaults.snapshotGB = parseInt(snpMatch[1], 10);
  }

  return defaults;
}
