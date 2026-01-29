
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-blue-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-stone-100 dark:border-blue-800 overflow-hidden animate-in zoom-in-95 duration-200 transition-colors">
        <div className="bg-red-50 dark:bg-red-950/30 p-6 md:p-8 border-b border-red-100 dark:border-red-900/30 flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-stone-800 dark:text-white uppercase tracking-tight">Konfirmasi</h3>
            <p className="text-[10px] text-stone-500 dark:text-blue-300 font-bold uppercase tracking-wider">Periksa kembali data ekspedisi Anda</p>
          </div>
        </div>
        
        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
           {error && (
             <div className="p-4 bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl animate-in shake duration-300">
               <div className="flex gap-3">
                 <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <div className="flex flex-col">
                   <p className="text-[10px] font-black text-red-700 dark:text-red-200 uppercase leading-relaxed">{error}</p>
                   <p className="text-[8px] font-bold text-red-600/70 dark:text-red-400/70 uppercase mt-1 italic">*Anda dapat mencoba lagi atau membatalkan untuk memperbaiki data.</p>
                 </div>
               </div>
             </div>
           )}

           <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="col-span-2">
                 <span className="block text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest mb-1">Nama Peserta</span>
                 <span className="font-black text-stone-800 dark:text-white text-lg uppercase leading-tight">{data.fullName}</span>
              </div>
              <div>
                 <span className="block text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest mb-1">Kode Pendaki / NIK</span>
                 <span className="font-bold text-stone-700 dark:text-blue-100">{data.climberCode}</span>
              </div>
              <div>
                 <span className="block text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest mb-1">WhatsApp</span>
                 <span className="font-bold text-stone-700 dark:text-blue-100">{data.whatsapp}</span>
              </div>
              <div className="col-span-2">
                 <span className="block text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest mb-1">Alamat Domisili</span>
                 <p className="font-bold text-stone-700 dark:text-blue-100 text-xs leading-relaxed">{data.address}</p>
              </div>
              <div>
                 <span className="block text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest mb-1">Gunung Tujuan</span>
                 <span className="font-bold text-red-600 dark:text-red-400">{data.mountain}</span>
              </div>
              <div>
                 <span className="block text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest mb-1">Rentang Tanggal</span>
                 <span className="font-bold text-stone-700 dark:text-blue-100 text-[10px] leading-tight block">
                   {data.startDate} s/d<br/>{data.endDate}
                 </span>
              </div>
              
              {data.medicalNotes && (
                <div className="col-span-2 bg-red-50 dark:bg-red-950/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                   <span className="block text-[9px] font-black text-red-400 dark:text-red-400 uppercase tracking-widest mb-1">Catatan Medis</span>
                   <span className="font-bold text-red-700 dark:text-red-200 text-xs italic">"{data.medicalNotes}"</span>
                </div>
              )}
           </div>
           <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3 transition-colors">
             <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
             <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-bold uppercase tracking-tight">
               Sistem akan mengirimkan bukti pendaftaran ke email Anda. Tim kami akan segera menindaklanjuti data Anda.
             </p>
           </div>
        </div>

        <div className="p-6 md:p-8 bg-stone-50 dark:bg-blue-950/50 border-t border-stone-200 dark:border-blue-800 flex flex-col sm:flex-row gap-3 transition-colors">
          <button 
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="flex-1 px-4 py-4 bg-white dark:bg-blue-800 border border-stone-200 dark:border-blue-700 text-stone-500 dark:text-blue-300 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-stone-100 dark:hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            disabled={isSending}
            className={`flex-1 px-4 py-4 ${error ? 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 shadow-red-200/50 dark:shadow-red-900/20' : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 shadow-green-200/50 dark:shadow-green-900/20'} text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50`}
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : error ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Coba Lagi
              </>
            ) : (
              "Ya, Kirim Sekarang"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
