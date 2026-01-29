
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  error?: string;
}

const Select: React.FC<SelectProps> = ({ label, options, error, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="px-1">
        <label className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">{label}</label>
      </div>
      <div className="relative group">
        <select 
          {...props}
          className={`w-full appearance-none px-5 py-4 bg-stone-50 dark:bg-stone-800 border rounded-2xl outline-none transition-all cursor-pointer font-bold text-sm text-stone-800 dark:text-stone-100 pr-12 ${
            error 
              ? "border-red-500 ring-2 ring-red-500/10" 
              : "border-stone-200 dark:border-stone-700 focus:border-red-600 dark:focus:border-red-500 focus:bg-white dark:focus:bg-stone-900 focus:ring-4 focus:ring-red-600/5"
          }`}
        >
          <option value="" disabled className="text-stone-400 dark:text-stone-600">Pilih Destinasi Gunung...</option>
          {options.map(opt => (
            <option key={opt} value={opt} className="text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-900 py-2">{opt}</option>
          ))}
        </select>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 group-focus-within:text-red-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-tight px-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;
