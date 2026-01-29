
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
      <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest px-1">{label}</label>
      <div className="flex flex-wrap gap-3">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-6 py-3 text-[10px] font-black uppercase rounded-xl border-2 transition-all duration-300 ${
              value === opt 
                ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-105' 
                : 'bg-slate-800 border-transparent text-stone-500 hover:border-stone-700'
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
