
import React from 'react';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-blue-950/90 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative bg-white dark:bg-blue-900 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(185,28,28,0.15)] border border-stone-200 dark:border-blue-800 animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
        
        {/* Background Decorative Element */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-red-600/20 to-transparent pointer-events-none"></div>
        
        <div className="relative p-10 md:p-14 text-center space-y-8">
          <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center rotate-12 shadow-2xl shadow-red-600/40 mx-auto mb-10">
            <svg viewBox="0 0 500 500" className="w-10 h-10 fill-white"><path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" /></svg>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tighter leading-none">
              Halo, <span className="text-red-600">Petualang!</span>
            </h2>
            <p className="text-[10px] font-black text-stone-400 dark:text-blue-300 uppercase tracking-[0.4em]">
              Selamat Datang di Jejak Langkah
            </p>
          </div>

          <div className="py-6 border-y border-stone-100 dark:border-blue-800">
            <p className="text-stone-600 dark:text-blue-100 text-sm italic font-medium leading-relaxed">
              "Bukan gunung yang kita taklukkan, melainkan diri kita sendiri."
            </p>
            <p className="text-[9px] font-bold text-stone-400 dark:text-blue-400 mt-2 uppercase tracking-widest">— Sir Edmund Hillary</p>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-stone-500 dark:text-blue-300/60 leading-relaxed max-w-xs mx-auto">
              Siapkan fisik dan mentalmu. Lengkapi data diri untuk memulai ekspedisi menuju puncak tertinggi Nusantara.
            </p>
            
            <button 
              onClick={onClose}
              className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              Mulai Ekspedisi 
              <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-stone-50 dark:bg-blue-950/50 p-6 text-center border-t border-stone-100 dark:border-blue-800">
          <p className="text-[8px] font-black text-stone-400 dark:text-blue-400/40 uppercase tracking-widest">
            Sistem Pendaftaran Resmi V1.1 • Terverifikasi Aman
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
