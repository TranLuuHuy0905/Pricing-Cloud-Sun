import { useState } from 'react';
import { ShieldAlert, Plus, X, Globe, Network, ArrowUpRight } from 'lucide-react';
import type { CartItem } from '../types';
import { PRICING } from '../config/pricing';
import { HOURS_PER_MONTH } from '../utils/pricingCalculator';
import { formatCurrency } from '../utils/format';

interface Props {
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
}

export default function CrossSellBanner({ cart, onAddToCart }: Props) {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  if (cart.length === 0) return null;

  // Check if cart has VM
  const hasVm = cart.some((i) => i.serviceId === 'vmCustom' || i.serviceId === 'vmPackages');
  
  // Check if any item mentions backup
  const hasBackup = cart.some(
    (i) => 
      /backup/i.test(i.description) || 
      /sao lưu/i.test(i.description) || 
      (i.configData && i.configData.backupGB > 0)
  );

  // Check if any item mentions IP
  const hasIp = cart.some(
    (i) => 
      /IP/i.test(i.description) || 
      (i.configData && i.configData.ips > 0)
  );

  // Check if multiple VMs but no VPC
  const vmCount = cart.filter((i) => i.serviceId === 'vmCustom' || i.serviceId === 'vmPackages').length;
  const hasVpc = cart.some((i) => i.serviceId === 'vpc');

  const suggestions: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    icon: any;
    actionLabel: string;
    onApply: () => void;
  }> = [];

  // Suggestion 1: Cloud Backup
  if (hasVm && !hasBackup && !dismissed['backup']) {
    const backup100GbPrice = Math.round(100 * PRICING.vmCustom.hourly.backup * HOURS_PER_MONTH); // ~101,470đ
    suggestions.push({
      id: 'backup',
      title: 'Chưa có bản sao lưu (Backup) dự phòng',
      description: 'Khuyến nghị bổ sung Cloud Backup để bảo vệ toàn vẹn dữ liệu cho khách hàng khi có sự cố.',
      price: backup100GbPrice,
      icon: ShieldAlert,
      actionLabel: `+ Thêm Cloud Backup 100GB (${formatCurrency(backup100GbPrice)}/th)`,
      onApply: () => {
        onAddToCart({
          id: crypto.randomUUID(),
          serviceId: 'custom',
          serviceName: 'Cloud Backup Tự động (100GB)',
          description: 'Dịch vụ sao lưu tự động định kỳ hàng ngày, lưu trữ độc lập trên hạ tầng Object Storage dự phòng an toàn.',
          quantity: 1,
          monthlyPrice: backup100GbPrice,
        });
        setDismissed((prev) => ({ ...prev, backup: true }));
      },
    });
  }

  // Suggestion 2: Dedicated Public IP
  if (hasVm && !hasIp && !dismissed['ip']) {
    const ipPrice = PRICING.vmCustom.ip; // 100,000đ
    suggestions.push({
      id: 'ip',
      title: 'Cần IP Tĩnh riêng cho máy chủ?',
      description: 'Nếu máy chủ chạy Website hoặc Mail Server, cần gán IP Tĩnh riêng để trỏ tên miền.',
      price: ipPrice,
      icon: Globe,
      actionLabel: `+ Thêm 1 IP Tĩnh WAN (${formatCurrency(ipPrice)}/th)`,
      onApply: () => {
        onAddToCart({
          id: crypto.randomUUID(),
          serviceId: 'custom',
          serviceName: 'Địa chỉ IP Public Tĩnh',
          description: '1 IP WAN riêng biệt cho máy chủ, hỗ trợ cấu hình DNS trỏ domain trực tiếp.',
          quantity: 1,
          monthlyPrice: ipPrice,
        });
        setDismissed((prev) => ({ ...prev, ip: true }));
      },
    });
  }

  // Suggestion 3: VPC for multi-server
  if (vmCount >= 2 && !hasVpc && !dismissed['vpc']) {
    const vpcPrice = PRICING.vpc.price; // 150,000đ
    suggestions.push({
      id: 'vpc',
      title: 'Mạng riêng ảo (VPC) kết nối nội bộ',
      description: `Đang có ${vmCount} máy chủ. Gom vào mạng VPC nội bộ giúp truyền dữ liệu miễn phí và an toàn không qua Internet.`,
      price: vpcPrice,
      icon: Network,
      actionLabel: `+ Thêm Mạng VPC (${formatCurrency(vpcPrice)}/th)`,
      onApply: () => {
        onAddToCart({
          id: crypto.randomUUID(),
          serviceId: 'vpc',
          serviceName: 'Mạng riêng ảo (VPC)',
          description: 'Mạng riêng ảo cách ly bảo mật cao, kết nối các máy chủ với băng thông nội bộ tốc độ cao.',
          quantity: 1,
          monthlyPrice: vpcPrice,
        });
        setDismissed((prev) => ({ ...prev, vpc: true }));
      },
    });
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {suggestions.map((sug) => {
        const Icon = sug.icon;
        return (
          <div
            key={sug.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-amber-50/90 border border-amber-200/90 rounded-xl text-amber-950 transition-all animate-in fade-in"
          >
            <div className="flex items-start gap-3">
              <span className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                <Icon className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-900">{sug.title}</h4>
                  <span className="text-[10px] font-semibold bg-amber-200/70 text-amber-800 px-1.5 py-0.2 rounded">
                    Khuyến nghị Presales
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 mt-0.5">{sug.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={sug.onApply}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{sug.actionLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissed((prev) => ({ ...prev, [sug.id]: true }))}
                title="Bỏ qua gợi ý"
                className="p-1.5 text-amber-500 hover:text-amber-800 hover:bg-amber-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
