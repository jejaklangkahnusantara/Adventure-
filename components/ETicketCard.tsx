
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
    // Use a container element to ensure consistent rendering regardless of viewport
    const originalStyle = ticketRef.current.style.cssText;
    
    // Temporarily fix width and center for capture
    ticketRef.current.style.width = '600px';
    ticketRef.current.style.maxWidth = 'none';
    ticketRef.current.style.margin = '0';

    try {
      const canvas = await html2canvas(ticketRef.current, { 
        scale: 3, 
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: 600,
        height: ticketRef.current.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      
      const displayWidth = 160; 
      const displayHeight = displayWidth / ratio;
      
      const x = (pdfWidth - displayWidth) / 2;
      const y = 20;

      pdf.addImage(imgData, 'PNG', x, y, displayWidth, displayHeight);
      pdf.save(`ETICKET-${registration.mountain.toUpperCase()}-${registration.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (e) { 
      console.error(e);
      alert('Gagal mengunduh PDF. Silakan coba lagi.'); 
    } finally { 
      if (ticketRef.current) ticketRef.current.style.cssText = originalStyle;
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
        className="relative bg-white text-stone-900 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border border-stone-100 flex flex-col"
        style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}
      >
        {/* Top Header / Branding */}
        <div className="bg-accent p-8 md:p-10 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <svg viewBox="0 0 500 500" className="w-6 h-6 fill-white"><path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" /></svg>
            </div>
            <div>
              <h4 className="text-[14px] font-black uppercase tracking-[0.2em] leading-none">Jejak Langkah</h4>
              <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest mt-1.5">Adventure Expedition</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[12px] font-mono font-black tracking-[0.2em] bg-black/20 px-5 py-2.5 rounded-full">
              {bookingId}
            </span>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-10 md:p-12 space-y-12">
          {/* Destination Header */}
          <div className="text-center space-y-4">
            <span className="text-[11px] font-black text-stone-400 uppercase tracking-[0.4em]">Destinasi Ekspedisi</span>
            <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-accent leading-none">
              {registration.mountain}
            </h3>
          </div>

          {/* Primary Detail: Name (Highly Visible) */}
          <div className="bg-stone-50 p-8 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 flex flex-col items-center text-center space-y-3 shadow-inner">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Nama Peserta Terdaftar</span>
            <p className="text-2xl md:text-3xl font-black uppercase tracking-tight text-stone-800 break-words w-full">
              {registration.fullName}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-10 gap-x-8 border-y border-stone-100 py-12">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Keberangkatan</span>
              <p className="text-base font-black uppercase text-stone-700">{registration.startDate || '-'}</p>
            </div>
            <div className="space-y-2 text-right">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Kepulangan</span>
              <p className="text-base font-black uppercase text-stone-700">{registration.endDate || '-'}</p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tipe Trip</span>
              <p className="text-base font-black uppercase text-accent/80">{registration.tripType}</p>
            </div>
            <div className="space-y-2 text-right">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Kategori Paket</span>
              <p className="text-base font-black uppercase text-accent/80">{registration.packageCategory}</p>
            </div>
          </div>

          {/* Status Section */}
          <div className="flex justify-between items-center relative pb-4">
            <div className="space-y-3">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Status Validasi</span>
              <div className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg ${statusColors[registration.status] || 'bg-stone-100 text-stone-500'}`}>
                {registration.status}
              </div>
            </div>
            <div className="w-24 h-24 opacity-[0.05] absolute right-0 -top-4 pointer-events-none">
               <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
          </div>
        </div>

        {/* Footer / Barcode Look */}
        <div className="bg-stone-50 p-10 md:p-12 border-t border-dashed border-stone-200 flex flex-col items-center gap-8">
           <div className="flex gap-2 w-full justify-center">
             {[...Array(40)].map((_, i) => (
               <div key={i} className={`h-12 w-[2px] bg-stone-300 ${i % 5 === 0 ? 'w-[6px] bg-stone-400' : ''} ${i % 11 === 0 ? 'w-[4px] bg-stone-500' : ''}`}></div>
             ))}
           </div>
           <div className="text-center space-y-2">
             <p className="text-[10px] font-mono text-stone-400 font-bold tracking-[0.4em] uppercase">
               Generated by Jejak Langkah Adventure Cloud System
             </p>
             <p className="text-[9px] font-black text-stone-300 uppercase tracking-[0.2em]">Official Expedition Document • 2024</p>
           </div>
        </div>
      </div>

      <div className="mt-10 flex gap-4 px-4 no-print max-w-[500px] mx-auto pb-10">
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGenerating}
          className="flex-1 py-6 bg-stone-900 hover:bg-black text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          {isGenerating ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Unduh E-Ticket (PDF)
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ETicketCard;
