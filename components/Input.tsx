
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  isTextArea?: boolean;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, isTextArea, error, ...props }) => {
  const baseClasses = `w-full px-4 py-3 bg-stone-50 dark:bg-stone-800/50 border-2 rounded-xl outline-none transition-all text-sm font-bold ${
    error 
      ? "border-red-500/50" 
      : "border-stone-100 dark:border-stone-800 focus:border-red-600 dark:focus:border-red-600"
  }`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">{label}</label>
      {isTextArea ? (
        <textarea {...(props as any)} className={`${baseClasses} min-h-[100px]`} />
      ) : (
        <input {...props} className={baseClasses} />
      )}
      {error && <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-1">{error}</span>}
    </div>
  );
};

export default Input;
