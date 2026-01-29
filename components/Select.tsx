
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  error?: string;
}

const Select: React.FC<SelectProps> = ({ label, options, error, ...props }) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <label className={`text-[10px] font-black uppercase tracking-[0.15em] px-1 ${error ? 'text-red-500' : 'text-stone-500'}`}>{label}</label>
      <div className="relative">
        <select 
          {...props}
          className={`w-full appearance-none px-6 py-5 bg-stone-100 dark:bg-slate-800/60 border-2 rounded-[1.5rem] outline-none font-bold text-sm cursor-pointer transition-all ${
            error 
              ? "border-red-500/50 text-red-600 dark:text-red-400" 
              : "border-transparent focus:border-accent text-stone-900 dark:text-white"
          }`}
        >
          <option value="" className="bg-white dark:bg-midnight">Pilih...</option>
          {options.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-midnight">{opt}</option>)}
        </select>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
      {error && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1">{error}</span>}
    </div>
  );
};

export default Select;
