
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  isTextArea?: boolean;
  error?: string;
  action?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, isTextArea, error, action, ...props }) => {
  const baseClasses = `w-full px-4 md:px-5 py-3 md:py-3.5 border rounded-2xl outline-none transition-all bg-stone-50 dark:bg-stone-800/50 text-stone-800 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 font-medium text-sm ${
    error 
      ? "border-red-500 focus:ring-2 focus:ring-red-500/20" 
      : "border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600/30 focus:border-red-500 dark:focus:border-red-600"
  }`;

  const remaining = props.maxLength && typeof props.value === 'string' 
    ? props.maxLength - props.value.length 
    : null;
  
  return (
    <div className="flex flex-col gap-1.5 w-full" data-error={!!error}>
      <div className="flex justify-between items-end px-1">
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">{label}</label>
          {action}
        </div>
        {remaining !== null && (
          <span className={`text-[9px] font-black uppercase tracking-tighter ${remaining <= 10 ? 'text-red-500 animate-pulse' : 'text-stone-400'}`}>
            Sisa: {remaining}
          </span>
        )}
      </div>
      {isTextArea ? (
        <textarea 
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} 
          className={`${baseClasses} min-h-[100px] resize-none leading-relaxed`}
        />
      ) : (
        <input 
          {...props} 
          className={baseClasses}
        />
      )}
      {error && (
        <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-tight px-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
