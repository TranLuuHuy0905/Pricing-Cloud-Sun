import { Plus, Minus } from 'lucide-react';

interface Props {
  value: number | string;
  onChange: (val: number | string) => void;
  min?: number;
  step?: number;
  placeholder?: string;
}

export function NumberInput({ value, onChange, min = 0, step = 1, placeholder }: Props) {
  return (
    <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      <button 
        type="button" 
        onClick={() => {
          const current = typeof value === 'number' ? value : (parseInt(value as string) || min);
          onChange(Math.max(min, current - step));
        }} 
        className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border-r border-slate-300"
      >
        <Minus className="w-4 h-4" />
      </button>
      <input 
        type="number" 
        min={min} 
        step={step}
        placeholder={placeholder}
        value={value} 
        onChange={e => { 
          if (e.target.value === '') {
            onChange('');
          } else {
            const val = parseInt(e.target.value);
            if (!isNaN(val)) onChange(val); 
          }
        }} 
        onBlur={() => {
          if (value === '') {
            onChange(min);
          } else {
            const current = typeof value === 'number' ? value : parseInt(value as string);
            if (!isNaN(current)) onChange(Math.max(min, current));
          }
        }}
        className="w-full px-3 py-2 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
      />
      <button 
        type="button" 
        onClick={() => {
          const current = typeof value === 'number' ? value : (parseInt(value as string) || min);
          onChange(current + step);
        }} 
        className="px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border-l border-slate-300"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
