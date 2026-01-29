
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  isTextArea?: boolean;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, isTextArea, error, ...props }) => {
  const baseClasses = `w-full px-5 py-4 bg-slate-800 border-2 rounded-2xl outline-none transition-all text-sm font-medium text-white placeholder:text-stone-600 ${
    error 
      ? "border-red-500/50" 
      : "border-transparent focus:border-accent shadow-inner"
  }`;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest px-1">{label}</label>
      {isTextArea ? (
        <textarea {...(props as any)} className={`${baseClasses} min-h-[120px] resize-none`} />
      ) : (
        <input {...props} className={baseClasses} />
      )}
      {error && <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest px-1">{error}</span>}
    </div>
  );
};

export default Input;
