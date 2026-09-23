import { useState, useEffect, type FormEvent } from 'react';
import { UserCheck, X, Phone, Mail, Award, Check } from 'lucide-react';
import type { SalesProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: SalesProfile) => void;
  currentProfile?: SalesProfile;
}

const DEFAULT_PROFILE: SalesProfile = {
  name: 'Chuyên viên Tư vấn Cloud',
  title: 'Phòng SME HCM',
  phone: '0901 234 567',
  email: 'sme.hcm@cloud.vn',
};

export function getStoredSalesProfile(): SalesProfile {
  try {
    const saved = localStorage.getItem('sme_sales_profile');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_PROFILE;
}

export default function SalesProfileModal({ isOpen, onClose, onSave, currentProfile }: Props) {
  const [formData, setFormData] = useState<SalesProfile>(currentProfile || DEFAULT_PROFILE);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(currentProfile || getStoredSalesProfile());
      setIsSavedAlert(false);
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('sme_sales_profile', JSON.stringify(formData));
    } catch (e) {
      // ignore
    }
    onSave(formData);
    setIsSavedAlert(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Chữ ký Chuyên viên Sales / Presales</h3>
              <p className="text-xs text-slate-400">Tự động chèn vào báo giá Excel & tin nhắn Zalo gửi khách</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Họ và tên chuyên viên
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Trần Lưu Huy"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Chức danh / Đơn vị
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Chuyên viên Tư vấn Cloud SME HCM"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Số điện thoại / Zalo
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="09xx xxx xxx"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                Email liên hệ
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sales@cloud.vn"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
            <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>Thông tin này được lưu cục bộ trên máy tính của bạn, không cần nhập lại ở các lần báo giá sau.</span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
            >
              {isSavedAlert ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Đã lưu!</span>
                </>
              ) : (
                <span>Lưu thông tin</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
