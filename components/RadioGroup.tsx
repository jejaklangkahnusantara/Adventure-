
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
    <div className="flex flex-col gap-4">
      <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.15em] px-1">{label}</label>
      <div className="flex flex-wrap gap-3">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 min-w-[130px] px-6 py-4.5 text-[10px] font-black uppercase rounded-[1.3rem] border-2 transition-all duration-300 active:scale-95 ${
              value === opt 
                ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' 
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
