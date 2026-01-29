
import React from 'react';

interface RadioGroupProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ label, options, value, onChange }) => {
  return (
    <div className="flex flex-col gap-5">
      <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.2em] px-2">{label}</label>
      <div className="flex flex-wrap gap-4">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 min-w-[150px] px-8 py-6.5 text-[12px] md:text-[13px] font-black uppercase tracking-widest rounded-[2rem] border-2 transition-all duration-300 active:scale-95 ${
              value === opt 
                ? 'bg-accent border-accent text-white shadow-[0_15px_30px_-5px_rgba(225,29,72,0.3)]' 
                : 'bg-stone-100 dark:bg-slate-800/40 border-transparent text-stone-500 hover:border-stone-400 dark:hover:border-stone-700'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RadioGroup;
