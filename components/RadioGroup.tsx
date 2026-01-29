
import React from 'react';

interface RadioGroupProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  error?: string;
  columns?: number;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ 
  label, 
  options, 
  value, 
  onChange, 
  className = '', 
  error,
  columns = 2
}) => {
  const labelId = label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className={`flex flex-col gap-3 ${className}`} role="radiogroup" aria-labelledby={labelId}>
      <div className="px-1 flex justify-between items-center">
        <label id={labelId} className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
          {label}
        </label>
        {value && (
          <span className="text-[8px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded uppercase animate-in fade-in zoom-in">
            Terpilih
          </span>
        )}
      </div>
      <div className={`grid grid-cols-2 ${columns === 3 ? 'sm:grid-cols-3' : ''} gap-2`}>
        {options.map((option) => {
          const isActive = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(option)}
              className={`group relative py-3 px-3 flex flex-col items-center justify-center gap-1.5 transition-all rounded-2xl border-2 text-center ${
                isActive 
                  ? 'bg-white dark:bg-stone-800 border-red-600 dark:border-red-500 shadow-lg shadow-red-900/5 ring-4 ring-red-600/5 dark:ring-red-500/10' 
                  : 'bg-stone-50 dark:bg-stone-800/50 border-transparent text-stone-500 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800 hover:border-stone-200 dark:hover:border-stone-700'
              }`}
            >
              <span className={`text-[10px] uppercase tracking-wider transition-all leading-tight ${isActive ? 'font-black text-red-700 dark:text-red-400' : 'font-bold'}`}>
                {option.replace('Gunung ', '')}
              </span>
              <div className={`w-1 h-1 rounded-full transition-all ${isActive ? 'bg-red-600 dark:bg-red-500 scale-125' : 'bg-transparent'}`}></div>
            </button>
          );
        })}
      </div>
      {error && (
        <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-tight px-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </span>
      )}
    </div>
  );
};

export default RadioGroup;
