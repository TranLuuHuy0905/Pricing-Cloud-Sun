import { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Server, 
  ArrowRight, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  Layers,
  Database as DbIcon,
  Globe,
  FileSpreadsheet,
  Mail,
  FolderArchive,
  Code
} from 'lucide-react';
import type { CartItem } from '../types';
import { calculateVmCustomPrice, formatVmCustomDescription } from '../utils/pricingCalculator';
import { formatCurrency } from '../utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (items: CartItem[]) => void;
}

interface SizingTemplate {
  id: string;
  category: string;
  title: string;
  icon: any;
  description: string;
  tiers: {
    name: string;
    scaleLabel: string;
    recommendedFor: string;
    cpu: number;
    ram: number;
    tier: 'standard' | 'premium';
    sysDiskSize: number;
    sysDiskType: 'hdd' | 'ssd';
    sysIops: number;
    dataDiskSize: number;
    dataDiskType: 'hdd' | 'ssd';
    dataIops: number;
    ips: number;
    backupGB: number;
    snapshotGB: number;
    note?: string;
  }[];
}

const TEMPLATES: SizingTemplate[] = [
  {
    id: 'accounting-erp',
    category: 'Doanh nghiệp',
    title: 'Kế toán & ERP (MISA, Bravo, FAST)',
    icon: FileSpreadsheet,
    description: 'Chạy ứng dụng kế toán, quản trị doanh nghiệp, bảo mật số liệu tài chính',
    tiers: [
      {
        name: 'Gói Cơ bản',
        scaleLabel: 'Dưới 10 nhân sự',
        recommendedFor: 'Kế toán MISA SME 5-10 máy trạm truy cập đồng thời',
        cpu: 2,
        ram: 4,
        tier: 'standard',
        sysDiskSize: 60,
        sysDiskType: 'ssd',
        sysIops: 3000,
        dataDiskSize: 40,
        dataDiskType: 'ssd',
        dataIops: 3000,
        ips: 1,
        backupGB: 100,
        snapshotGB: 0,
        note: 'Đã gồm 1 IP tĩnh & Tự động sao lưu dữ liệu kế toán',
      },
      {
        name: 'Gói Tiêu chuẩn',
        scaleLabel: '15 - 35 nhân sự',
        recommendedFor: 'Bravo, FAST, MISA Enterprise chạy SQL Server ổn định',
        cpu: 4,
        ram: 8,
        tier: 'standard',
        sysDiskSize: 80,
        sysDiskType: 'ssd',
        sysIops: 4000,
        dataDiskSize: 120,
        dataDiskType: 'ssd',
        dataIops: 4000,
        ips: 1,
        backupGB: 200,
        snapshotGB: 100,
        note: 'Hiệu năng SSD cao, sao lưu hàng ngày + Snapshot dự phòng sự cố',
      },
      {
        name: 'Gói Nâng cao (ERP)',
        scaleLabel: 'Trên 40 nhân sự',
        recommendedFor: 'ERP chuyên sâu, khối lượng giao dịch lớn, chạy liên tục 24/7',
        cpu: 8,
        ram: 16,
        tier: 'premium',
        sysDiskSize: 100,
        sysDiskType: 'ssd',
        sysIops: 5000,
        dataDiskSize: 250,
        dataDiskType: 'ssd',
        dataIops: 5000,
        ips: 1,
        backupGB: 300,
        snapshotGB: 200,
        note: 'Dòng chip Premium tốc độ cao + IOPS lớn cho Database tải nặng',
      },
    ],
  },
  {
    id: 'web-ecommerce',
    category: 'Website',
    title: 'Website & Thương mại điện tử',
    icon: Globe,
    description: 'Hosting website công ty, tin tức, cổng thông tin hoặc shop online',
    tiers: [
      {
        name: 'Web Công ty',
        scaleLabel: '< 20.000 lượt truy cập/tháng',
        recommendedFor: 'WordPress, Landing page giới thiệu công ty & dịch vụ',
        cpu: 2,
        ram: 2,
        tier: 'standard',
        sysDiskSize: 50,
        sysDiskType: 'ssd',
        sysIops: 3000,
        dataDiskSize: 0,
        dataDiskType: 'ssd',
        dataIops: 3000,
        ips: 1,
        backupGB: 50,
        snapshotGB: 0,
        note: 'Tiết kiệm chi phí, dễ dàng nâng cấp khi lượng khách tăng',
      },
      {
        name: 'Web Bán hàng / Shop',
        scaleLabel: '50.000 - 150.000 truy cập/tháng',
        recommendedFor: 'WooCommerce, Haravan, Magento vừa, tải đơn hàng liên tục',
        cpu: 4,
        ram: 8,
        tier: 'standard',
        sysDiskSize: 60,
        sysDiskType: 'ssd',
        sysIops: 4000,
        dataDiskSize: 100,
        dataDiskType: 'ssd',
        dataIops: 4000,
        ips: 1,
        backupGB: 150,
        snapshotGB: 50,
        note: 'Đảm bảo tốc độ tải trang nhanh, không gián đoạn giờ cao điểm',
      },
      {
        name: 'E-commerce High Traffic',
        scaleLabel: '> 300.000 truy cập / Chiến dịch Flash Sale',
        recommendedFor: 'Hệ thống thương mại điện tử lớn, chịu tải đột biến tốt',
        cpu: 8,
        ram: 16,
        tier: 'premium',
        sysDiskSize: 80,
        sysDiskType: 'ssd',
        sysIops: 5000,
        dataDiskSize: 200,
        dataDiskType: 'ssd',
        dataIops: 5000,
        ips: 1,
        backupGB: 300,
        snapshotGB: 100,
        note: 'Chip Premium, ổ đĩa siêu tốc xử lý giỏ hàng mượt mà',
      },
    ],
  },
  {
    id: 'file-backup',
    category: 'Lưu trữ',
    title: 'Lưu trữ File & Sao lưu dữ liệu (Nextcloud/NAS/FTP)',
    icon: FolderArchive,
    description: 'Tập trung hóa tài liệu công ty, phân quyền chia sẻ và lưu trữ an toàn',
    tiers: [
      {
        name: 'File Server SME Nhỏ',
        scaleLabel: '10 - 25 người dùng',
        recommendedFor: 'Lưu trữ văn bản, hợp đồng, tài liệu văn phòng cơ bản',
        cpu: 2,
        ram: 4,
        tier: 'standard',
        sysDiskSize: 50,
        sysDiskType: 'ssd',
        sysIops: 3000,
        dataDiskSize: 300,
        dataDiskType: 'hdd',
        dataIops: 400,
        ips: 1,
        backupGB: 200,
        snapshotGB: 0,
        note: 'Kết hợp SSD chạy hệ điều hành mượt mà và HDD dung lượng lớn tiết kiệm',
      },
      {
        name: 'File Server Doanh nghiệp',
        scaleLabel: '30 - 70 người dùng',
        recommendedFor: 'Lưu trữ file thiết kế, ảnh chụp, video và tài liệu dự án',
        cpu: 4,
        ram: 8,
        tier: 'standard',
        sysDiskSize: 60,
        sysDiskType: 'ssd',
        sysIops: 3000,
        dataDiskSize: 800,
        dataDiskType: 'hdd',
        dataIops: 400,
        ips: 1,
        backupGB: 500,
        snapshotGB: 0,
        note: 'Dung lượng ổ dữ liệu lên tới 800GB, có backup định kỳ',
      },
    ],
  },
  {
    id: 'mail-server',
    category: 'Giao tiếp',
    title: 'Máy chủ Mail Doanh nghiệp (Zimbra / Postfix)',
    icon: Mail,
    description: 'Hệ thống email theo tên miền riêng (@congty.com), bảo mật và chủ động',
    tiers: [
      {
        name: 'Mail Server Tiêu chuẩn',
        scaleLabel: '20 - 50 Hộp thư',
        recommendedFor: 'Zimbra Open Source, iRedMail hoặc Mailcow',
        cpu: 4,
        ram: 8,
        tier: 'standard',
        sysDiskSize: 60,
        sysDiskType: 'ssd',
        sysIops: 4000,
        dataDiskSize: 200,
        dataDiskType: 'ssd',
        dataIops: 4000,
        ips: 1,
        backupGB: 200,
        snapshotGB: 0,
        note: 'IP Tĩnh riêng biệt hỗ trợ cấu hình PTR, SPF, DKIM chống spam',
      },
    ],
  },
  {
    id: 'dev-test',
    category: 'Phát triển',
    title: 'Môi trường Lập trình & Thử nghiệm (Dev / Staging / CI-CD)',
    icon: Code,
    description: 'Máy chủ chạy thử code, build phần mềm, demo cho khách hàng',
    tiers: [
      {
        name: 'Dev / Test Lab',
        scaleLabel: 'Team 3 - 8 Dev',
        recommendedFor: 'Chạy Docker, Gitlab Runner, test ứng dụng nội bộ',
        cpu: 2,
        ram: 4,
        tier: 'standard',
        sysDiskSize: 50,
        sysDiskType: 'ssd',
        sysIops: 3000,
        dataDiskSize: 50,
        dataDiskType: 'ssd',
        dataIops: 3000,
        ips: 1,
        backupGB: 0,
        snapshotGB: 50,
        note: 'Snapshot nhanh để hoàn tác mã nguồn khi thử nghiệm',
      },
    ],
  },
];

export default function SizingWizardModal({ isOpen, onClose, onApplyPreset }: Props) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);

  if (!isOpen) return null;

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
  const currentTier = currentTemplate.tiers[selectedTierIndex] || currentTemplate.tiers[0];

  // Calculate price for current tier
  const pricingResult = calculateVmCustomPrice({
    tier: currentTier.tier,
    cpu: currentTier.cpu,
    ram: currentTier.ram,
    ips: currentTier.ips,
    sysDiskType: currentTier.sysDiskType,
    sysIops: currentTier.sysIops,
    sysDiskSize: currentTier.sysDiskSize,
    dataDiskType: currentTier.dataDiskType,
    dataIops: currentTier.dataIops,
    dataDiskSize: currentTier.dataDiskSize,
    backupGB: currentTier.backupGB,
    snapshotGB: currentTier.snapshotGB,
  });

  const handleApply = () => {
    const config = {
      tier: currentTier.tier,
      cpu: currentTier.cpu,
      ram: currentTier.ram,
      ips: currentTier.ips,
      sysDiskType: currentTier.sysDiskType,
      sysIops: currentTier.sysIops,
      sysDiskSize: currentTier.sysDiskSize,
      dataDiskType: currentTier.dataDiskType,
      dataIops: currentTier.dataIops,
      dataDiskSize: currentTier.dataDiskSize,
      backupGB: currentTier.backupGB,
      snapshotGB: currentTier.snapshotGB,
    };

    const description = `[Khuyến nghị ${currentTemplate.title} - ${currentTier.name}]\n${formatVmCustomDescription(config)}`;

    const newItem: CartItem = {
      id: crypto.randomUUID(),
      serviceId: 'vmCustom',
      serviceName: `Cloud Server (${currentTier.name})`,
      description,
      quantity: 1,
      monthlyPrice: pricingResult.total,
      configData: config,
    };

    onApplyPreset([newItem]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold">Trợ lý Sizing Cấu hình Cloud (Presales Wizard)</h3>
                <span className="text-[11px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">Phòng SME HCM</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Chọn bài toán thực tế của khách hàng để nhận cấu hình chuẩn khuyến nghị chỉ trong 1 click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Step 1: Chọn bài toán / ứng dụng */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
              Bước 1: Chọn ứng dụng hoặc mục đích sử dụng của khách hàng
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setSelectedTierIndex(0);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {tmpl.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{tmpl.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tmpl.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Chọn quy mô / tải */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
              Bước 2: Chọn quy mô người dùng / lượng truy cập
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentTemplate.tiers.map((tier, idx) => {
                const isSelected = idx === selectedTierIndex;
                return (
                  <button
                    key={tier.name}
                    type="button"
                    onClick={() => setSelectedTierIndex(idx)}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 text-indigo-600">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 inline-block mb-1.5">
                      {tier.scaleLabel}
                    </span>
                    <h5 className="text-sm font-bold text-slate-800">{tier.name}</h5>
                    <p className="text-xs text-slate-500 mt-1">{tier.recommendedFor}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Xem chi tiết cấu hình khuyến nghị & Giá */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Cấu hình đề xuất cho {currentTemplate.title}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                  {currentTier.name} ({currentTier.scaleLabel})
                </h4>
                {currentTier.note && (
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {currentTier.note}
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 block">Chi phí ước tính / tháng</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(pricingResult.total)}
                </span>
                <span className="text-[11px] text-slate-400 block">(chưa bao gồm VAT)</span>
              </div>
            </div>

            {/* Spec Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  <span>vCPU</span>
                </div>
                <div className="font-bold text-slate-800">
                  {currentTier.cpu} vCPU <span className="text-xs font-normal text-slate-500">({currentTier.tier})</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <Layers className="w-4 h-4 text-cyan-500" />
                  <span>Bộ nhớ RAM</span>
                </div>
                <div className="font-bold text-slate-800">
                  {currentTier.ram} GB RAM
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <HardDrive className="w-4 h-4 text-amber-500" />
                  <span>Ổ cứng (Storage)</span>
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {currentTier.sysDiskSize}GB OS 
                  {currentTier.dataDiskSize > 0 && ` + ${currentTier.dataDiskSize}GB Data`}
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Sao lưu & IP</span>
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {currentTier.backupGB > 0 ? `${currentTier.backupGB}GB Backup` : 'Chưa backup'} 
                  {currentTier.ips > 0 && ` • ${currentTier.ips} IP`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <span>Áp dụng vào Báo giá</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
