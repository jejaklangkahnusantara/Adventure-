
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800">
        <div className="bg-red-600 p-6 text-white">
          <h3 className="text-sm font-black uppercase tracking-widest text-center">Ringkasan Pendaftaran</h3>
        </div>
        
        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Nama Lengkap</span>
              <p className="text-sm font-black uppercase">{data.fullName || '-'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">WhatsApp</span>
                <p className="text-xs font-bold">{data.whatsapp || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Email</span>
                <p className="text-xs font-bold truncate">{data.email || '-'}</p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700 space-y-4">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Tujuan Ekspedisi</span>
                <p className="text-lg font-black uppercase text-red-600">{data.mountain || 'Belum dipilih'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Tanggal</span>
                  <p className="text-[10px] font-bold">{data.startDate} - {data.endDate || 'Selesai'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Jenis Trip</span>
                  <p className="text-[10px] font-black uppercase">{data.tripType || '-'}</p>
                </div>
              </div>
            </div>

            {data.medicalNotes && (
              <div className="space-y-1">
                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Catatan Medis</span>
                <p className="text-[10px] font-medium italic text-stone-500">"{data.medicalNotes}"</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl">
            <p className="text-[9px] font-bold text-red-600 dark:text-red-400 text-center uppercase tracking-tighter">
              Pastikan semua data di atas sudah benar sebelum melanjutkan.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-600 rounded-xl text-center">
              <p className="text-[9px] font-black text-white uppercase">{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-stone-50 dark:bg-stone-800/50 flex gap-4">
          <button 
            onClick={onClose} 
            disabled={isSending} 
            className="flex-1 py-4 text-[10px] font-black uppercase text-stone-400 hover:text-stone-600 transition-colors"
          >
            Kembali
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isSending} 
            className="flex-[2] py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isSending ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                Konfirmasi & Daftar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
