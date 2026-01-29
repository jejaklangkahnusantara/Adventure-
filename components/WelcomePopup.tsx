
import React from 'react';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl p-10 text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-red-600/20">
          <svg viewBox="0 0 500 500" className="w-8 h-8 fill-white"><path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" /></svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-tight">Halo, Petualang!</h2>
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Selamat Datang di Jejak Langkah</p>
        </div>
        <p className="text-xs text-stone-500 leading-relaxed italic">"Bukan gunung yang kita taklukkan, melainkan diri kita sendiri."</p>
        <button 
          onClick={onClose}
          className="w-full py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-transform"
        >
          Mulai Ekspedisi
        </button>
      </div>
    </div>
  );
};

export default WelcomePopup;
