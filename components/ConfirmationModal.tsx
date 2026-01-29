
import React from 'react';
import { PersonalData } from '../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: PersonalData;
  isSending: boolean;
  error?: string | null;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, data, isSending, error }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-midnight/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-850 rounded-[2rem] md:rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border border-stone-800 animate-in zoom-in-95">
        <div className="bg-accent p-6 md:p-8 text-white text-center">
          <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Validasi Data</h3>
          <p className="text-[8px] md:text-[9px] font-bold opacity-70 mt-1 md:mt-2">Mohon periksa kembali detail ekspedisi Anda</p>
        </div>
        
        <div className="p-6 md:p-10 space-y-6 md:space-y-8 max-h-[60vh] md:max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <span className="text-[8px] md:text-[9px] font-black text-stone-500 uppercase tracking-widest">Nama Lengkap</span>
            <p className="text-sm md:text-base font-black uppercase text-white">{data.fullName || '-'}</p>
          </div>
          
          <div className="p-4 md:p-6 bg-midnight rounded-[1.5rem] md:rounded-[2rem] border border-stone-800 space-y-4 md:space-y-6">
            <div className="space-y-1">
              <span className="text-[8px] md:text-[9px] font-black text-accent uppercase tracking-widest">Tujuan</span>
              <p className="text-xl md:text-2xl font-black uppercase text-white leading-tight">{data.mountain || '---'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[8px] md:text-[9px] font-black text-stone-500 uppercase tracking-widest">Mulai</span>
                <p className="text-[10px] md:text-xs font-bold text-white">{data.startDate || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] md:text-[9px] font-black text-stone-500 uppercase tracking-widest">Trip</span>
                <p className="text-[10px] md:text-xs font-bold text-white uppercase">{data.tripType || '-'}</p>
              </div>
            </div>
          </div>

          {error && <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-[9px] font-black text-red-400 uppercase text-center">{error}</div>}
        </div>

        <div className="p-6 md:p-8 bg-slate-800/50 flex flex-col sm:flex-row gap-3 md:gap-4">
          <button 
            onClick={onClose} 
            disabled={isSending} 
            className="order-2 sm:order-1 flex-1 py-4 text-[10px] md:text-[11px] font-black uppercase text-stone-500 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isSending} 
            className="order-1 sm:order-2 flex-[2] py-4 md:py-5 bg-accent hover:bg-rose-500 text-white rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Ya, Daftarkan!"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
