
import React from 'react';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-midnight/95 backdrop-blur-[20px] animate-in fade-in duration-1000">
      <style>{`
        @keyframes spring-in {
          0% { transform: scale(0.8) translateY(100px) rotate(-2deg); opacity: 0; }
          60% { transform: scale(1.05) translateY(-10px) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) translateY(0) rotate(0); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(3deg); }
          50% { transform: translateY(-15px) rotate(-2deg); }
        }
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.4; }
        }
        @keyframes shimmer-fast {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(150%); }
        }
        .animate-spring-in { animation: spring-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-soft { animation: pulse-soft 4s ease-in-out infinite; }
        .stagger-1 { animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation-delay: 0.2s; opacity: 0; }
        .stagger-3 { animation-delay: 0.3s; opacity: 0; }
        .stagger-4 { animation-delay: 0.4s; opacity: 0; }
        .stagger-5 { animation-delay: 0.5s; opacity: 0; }
        .fade-up-in { animation: fade-up-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes fade-up-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative bg-slate-850/80 w-full max-w-md rounded-[3rem] md:rounded-[4rem] p-1 border border-white/10 shadow-[0_64px_128px_-24px_rgba(0,0,0,0.8)] animate-spring-in overflow-hidden group">
        
        {/* Ambient Decorative Elements */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-accent/30 rounded-full blur-[100px] animate-pulse-soft"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-red-900/20 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '2s' }}></div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none overflow-hidden w-full text-center">
          <span className="text-[100px] md:text-[180px] font-black text-white/[0.03] leading-none uppercase tracking-tighter inline-block transform -rotate-12 scale-150">
            SUMMIT
          </span>
        </div>

        <div className="relative bg-slate-850/40 rounded-[2.8rem] md:rounded-[3.8rem] p-10 md:p-16 text-center space-y-10 md:space-y-12">
          
          {/* Animated Icon Container */}
          <div className="relative mx-auto w-20 h-20 md:w-28 md:h-28 group-hover:scale-110 transition-transform duration-700 stagger-1 fade-up-in">
            <div className="absolute inset-0 bg-accent rounded-[1.8rem] md:rounded-[2.2rem] blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative w-full h-full bg-accent rounded-[1.8rem] md:rounded-[2.2rem] flex items-center justify-center shadow-2xl shadow-accent/40 animate-float transition-all duration-500">
              <svg viewBox="0 0 500 500" className="w-10 h-10 md:w-14 md:h-14 fill-white drop-shadow-2xl">
                <path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-4 stagger-2 fade-up-in">
            <p className="text-[10px] md:text-[11px] font-black text-accent uppercase tracking-[0.4em] md:tracking-[0.5em] flex items-center justify-center gap-3">
              <span className="w-8 h-[1px] bg-accent/30"></span>
              Pintu Menuju Puncak
              <span className="w-8 h-[1px] bg-accent/30"></span>
            </p>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white leading-none">
              Jejak Langkah <span className="text-stone-500">Adventure</span>
            </h2>
          </div>

          <div className="px-1 md:px-4 stagger-3 fade-up-in">
            <p className="text-sm md:text-base text-stone-300 leading-relaxed font-medium opacity-90 italic">
              "Petualangan bukan tentang mencapai puncak, tapi tentang langkah-langkah yang membentuk karakter kita."
            </p>
          </div>

          <div className="pt-4 space-y-8 stagger-4 fade-up-in">
            <button 
              onClick={onClose}
              className="group/btn relative w-full py-6 md:py-7 bg-accent hover:bg-rose-500 text-white font-black text-[11px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.5em] rounded-[1.5rem] md:rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(225,29,72,0.5)] transition-all active:scale-95 overflow-hidden border border-white/10"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer-fast_2s_infinite]"></div>
              
              <span className="relative flex items-center justify-center gap-3 md:gap-4 drop-shadow-md">
                MULAI EKSPEDISI
                <svg className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover/btn:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
            
            <div className="stagger-5 fade-up-in flex flex-col items-center gap-4">
              <div className="w-12 h-1.5 rounded-full bg-stone-800 flex overflow-hidden">
                <div className="h-full bg-accent w-1/3 animate-[shimmer-fast_1.5s_infinite]"></div>
              </div>
              <p className="text-[9px] font-black text-stone-600 uppercase tracking-[0.6em] opacity-40">
                SUMMIT VERIFICATION SYSTEM • V1.5
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
