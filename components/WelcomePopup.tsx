
import React from 'react';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-midnight/90 backdrop-blur-[12px] animate-in fade-in duration-700">
      <div className="relative bg-slate-850/80 w-full max-w-md rounded-[2.5rem] md:rounded-[3.5rem] p-1 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden group">
        
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-accent/20 rounded-full blur-[80px] animate-pulse"></div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">
          <span className="text-[60px] md:text-[120px] font-black text-white/[0.02] leading-none uppercase tracking-tighter">
            SUMMIT
          </span>
        </div>

        <div className="relative bg-slate-850/40 rounded-[2.3rem] md:rounded-[3.3rem] p-8 md:p-14 text-center space-y-8 md:space-y-10">
          
          <div className="relative mx-auto w-16 h-16 md:w-24 md:h-24 group-hover:scale-110 transition-transform duration-700">
            <div className="absolute inset-0 bg-accent rounded-[1.5rem] md:rounded-[2rem] blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative w-full h-full bg-accent rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl shadow-accent/40 rotate-3 group-hover:rotate-0 transition-all duration-500">
              <svg viewBox="0 0 500 500" className="w-8 h-8 md:w-12 md:h-12 fill-white drop-shadow-lg">
                <path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <p className="text-[8px] md:text-[10px] font-black text-accent uppercase tracking-[0.3em] md:tracking-[0.4em]">Selamat Datang di</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white leading-tight">
              Jejak Langkah <span className="text-stone-400">Adventure</span>
            </h2>
          </div>

          <div className="px-1 md:px-2">
            <p className="text-xs md:text-sm text-stone-300 leading-relaxed font-medium opacity-90">
              Siapkan diri Anda untuk menaklukkan puncak-puncak tertinggi Nusantara. Mari mulai perjalanan ekspedisi Anda.
            </p>
          </div>

          <div className="pt-2">
            <button 
              onClick={onClose}
              className="group/btn relative w-full py-5 md:py-6 bg-accent hover:bg-rose-500 text-white font-black text-xs uppercase tracking-[0.2em] md:tracking-[0.4em] rounded-[1.2rem] md:rounded-[1.8rem] shadow-[0_20px_40px_-10px_rgba(225,29,72,0.4)] transition-all active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
              
              <span className="relative flex items-center justify-center gap-2 md:gap-3">
                KLIK AKU KAKAK
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
              </span>
            </button>
            
            <p className="mt-6 md:mt-8 text-[8px] md:text-[9px] font-bold text-stone-600 uppercase tracking-widest opacity-50">
              EXPLORE THE UNKNOWN • V1.5
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
