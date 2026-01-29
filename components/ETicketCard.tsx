
import React, { useRef, useState } from 'react';
import { Registration } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ETicketCardProps {
  registration: Registration;
}

const ETicketCard: React.FC<ETicketCardProps> = ({ registration }) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(ticketRef.current, { 
        scale: 3, 
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
      pdf.save(`ETicket-${registration.mountain.replace(/\s+/g, '_')}-${registration.id}.pdf`);
    } catch (e) { 
      console.error(e);
      alert('Gagal mengunduh PDF. Silakan coba lagi.'); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const bookingId = `JL-${registration.id.toString().slice(-6).toUpperCase()}`;
  const statusColors: Record<string, string> = {
    'Terverifikasi': 'bg-green-500 text-white',
    'Menunggu Verifikasi': 'bg-amber-500 text-white',
    'Diproses': 'bg-blue-500 text-white',
    'Dibatalkan': 'bg-stone-500 text-white'
  };

  return (
    <div className="group animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div 
        ref={ticketRef} 
        className="relative bg-white text-stone-900 rounded-[2rem] overflow-hidden shadow-2xl border border-stone-200"
        style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}
      >
        {/* Top Header / Branding */}
        <div className="bg-accent p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
              <svg viewBox="0 0 500 500" className="w-4 h-4 fill-white"><path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" /></svg>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Jejak Langkah</h4>
              <p className="text-[7px] font-bold opacity-60 uppercase tracking-widest mt-1">Adventure Expedition</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-black tracking-widest bg-black/20 px-3 py-1 rounded-full">
              {bookingId}
            </span>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-8 space-y-8">
          {/* Destination Header */}
          <div className="text-center space-y-2">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.3em]">Destinasi Ekspedisi</span>
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-accent leading-none">
              {registration.mountain}
            </h3>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-y border-stone-100 py-8">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Nama Peserta</span>
              <p className="text-sm font-black uppercase truncate">{registration.fullName}</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Tgl Keberangkatan</span>
              <p className="text-sm font-black uppercase">{registration.startDate || '-'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Tipe Trip</span>
              <p className="text-sm font-black uppercase text-stone-600">{registration.tripType}</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Kategori Paket</span>
              <p className="text-sm font-black uppercase text-stone-600">{registration.packageCategory}</p>
            </div>
          </div>

          {/* Status & Perforation Look */}
          <div className="flex justify-between items-center relative">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Status Booking</span>
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[registration.status] || 'bg-stone-100 text-stone-500'}`}>
                {registration.status}
              </div>
            </div>
            <div className="w-16 h-16 opacity-10">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
          </div>
        </div>

        {/* Footer / Barcode Look */}
        <div className="bg-stone-50 p-6 border-t border-dashed border-stone-200 flex flex-col items-center gap-4">
           <div className="flex gap-1">
             {[...Array(40)].map((_, i) => (
               <div key={i} className={`h-8 w-[2px] bg-stone-300 ${i % 3 === 0 ? 'w-[4px] bg-stone-400' : ''}`}></div>
             ))}
           </div>
           <p className="text-[8px] font-mono text-stone-400 font-bold tracking-[0.5em] uppercase">
             Generated by Jejak Langkah Adventure Cloud System
           </p>
        </div>
      </div>

      <div className="mt-6 flex gap-3 px-4 no-print">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGenerating}
          className="flex-1 py-4 bg-accent hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Unduh Tiket (PDF)
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ETicketCard;
