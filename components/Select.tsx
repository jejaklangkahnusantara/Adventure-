
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  error?: string;
}

const Select: React.FC<SelectProps> = ({ label, options, error, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">{label}</label>
      <select 
        {...props}
        className={`w-full px-4 py-3 bg-stone-50 dark:bg-stone-800/50 border-2 rounded-xl outline-none font-bold text-sm cursor-pointer ${
          error ? "border-red-500/50" : "border-stone-100 dark:border-stone-800 focus:border-red-600"
        }`}
      >
        <option value="">Pilih...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {error && <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-1">{error}</span>}
    </div>
  );
};

export default Select;
