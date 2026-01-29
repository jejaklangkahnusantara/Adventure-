
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
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg border-2 transition-all ${
              value === opt ? 'bg-red-600 border-red-600 text-white' : 'border-stone-100 dark:border-stone-800 text-stone-400'
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
