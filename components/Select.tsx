
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  error?: string;
}

const Select: React.FC<SelectProps> = ({ label, options, error, ...props }) => {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest px-1">{label}</label>
      <div className="relative">
        <select 
          {...props}
          className={`w-full appearance-none px-5 py-4 bg-slate-800 border-2 rounded-2xl outline-none font-bold text-sm cursor-pointer text-white transition-all ${
            error ? "border-red-500/50" : "border-transparent focus:border-accent"
          }`}
        >
          <option value="" className="bg-midnight">Pilih Destinasi...</option>
          {options.map(opt => <option key={opt} value={opt} className="bg-midnight">{opt}</option>)}
        </select>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
      {error && <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest px-1">{error}</span>}
    </div>
  );
};

export default Select;
