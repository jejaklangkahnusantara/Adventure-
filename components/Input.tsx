
import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  isTextArea?: boolean;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, isTextArea, error, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const baseClasses = `w-full px-6 py-5 bg-stone-100 dark:bg-slate-800/60 border-2 rounded-[1.5rem] outline-none transition-all duration-300 text-sm font-semibold shadow-sm ${
    error 
      ? "border-red-500/50 bg-red-500/5 text-red-600 dark:text-red-400" 
      : "border-transparent focus:border-accent focus:bg-white dark:focus:bg-slate-800 focus:shadow-accent/5 text-stone-900 dark:text-white"
  }`;

  return (
    <div className="flex flex-col gap-3 w-full group">
      <label className={`text-[10px] font-black uppercase tracking-[0.15em] px-1 transition-colors ${error ? 'text-red-500' : 'text-stone-500 group-focus-within:text-accent'}`}>
        {label}
      </label>
      <div className="relative w-full">
        {isTextArea ? (
          <textarea {...(props as any)} className={`${baseClasses} min-h-[160px] resize-none leading-relaxed`} />
        ) : (
          <div className="relative flex items-center">
            <input 
              {...props} 
              type={inputType}
              className={`${baseClasses} ${isPassword ? 'pr-14' : ''}`} 
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 w-10 h-10 flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-transform"
                title={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
              >
                <span role="img" aria-label="monkey-toggle">
                  {showPassword ? '🐵' : '🙈'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 px-1 animate-in fade-in slide-in-from-top-1">
          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{error}</span>
        </div>
      )}
    </div>
  );
};

export default Input;
