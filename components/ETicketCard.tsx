
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
      const element = ticketRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(`ticket-content-${registration.id}`);
          if (clonedElement) {
            // Paksa gaya visual untuk PDF agar terbaca jelas
            clonedElement.style.color = '#000000';
            clonedElement.querySelectorAll('*').forEach((el: any) => {
              el.style.color = el.classList.contains('text-red-700') ? '#b91c1c' : '#000000';
            });
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ticket-${registration.mountain.replace(/\s+/g, '-')}-${registration.id.toString().slice(-4)}.pdf`);
    } catch (error) {
      alert('Gagal membuat dokumen PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div 
        ref={ticketRef}
        id={`ticket-content-${registration.id}`}
        className="bg-white dark:bg-blue-900 rounded-[2.5rem] shadow-2xl border border-stone-200 dark:border-blue-800 overflow-hidden transition-all print:shadow-none print:border-none"
      >
        <div className="bg-red-700 p-8 text-white flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Expedition Pass</h3>
            <p className="text-[10px] font-bold text-red-200 uppercase tracking-[0.2em]">Official E-Ticket</p>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Jejak Langkah</div>
             <div className="text-lg font-black">#{registration.id.toString().slice(-6)}</div>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest">Nama Peserta</label>
              <p className="text-sm font-black uppercase text-stone-800 dark:text-white">{registration.fullName}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest">Climber ID / NIK</label>
              <p className="text-sm font-black uppercase text-stone-800 dark:text-white">{registration.climberCode}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest">Destinasi</label>
              <p className="text-sm font-black uppercase text-red-700 dark:text-red-400">{registration.mountain}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest">Keberangkatan</label>
              <p className="text-xs font-bold text-stone-800 dark:text-blue-100">{registration.startDate}</p>
            </div>
          </div>
          
          <div className="pt-8 border-t border-dashed border-stone-200 dark:border-blue-800 flex justify-between items-end">
             <div className="space-y-1">
               <label className="text-[8px] font-black text-stone-300 dark:text-blue-300/20 uppercase tracking-widest">Status Verifikasi</label>
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 dark:text-blue-400">{registration.status}</span>
               </div>
             </div>
             <div className="w-16 h-16 bg-stone-100 dark:bg-blue-800 rounded-xl p-2">
                <div className="w-full h-full grid grid-cols-4 gap-0.5 opacity-30">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className={`bg-stone-800 dark:bg-blue-200 ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`}></div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 no-print">
        <button 
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex-1 py-5 bg-stone-900 dark:bg-blue-700 text-white dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all disabled:opacity-50"
        >
          {isGenerating ? 'Memproses PDF...' : 'Unduh E-Ticket'}
        </button>
      </div>
    </div>
  );
};

export default ETicketCard;
