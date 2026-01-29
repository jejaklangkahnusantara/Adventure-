
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
      const canvas = await html2canvas(ticketRef.current, { scale: 3, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
      pdf.save(`Ticket-${registration.id}.pdf`);
    } catch (e) { alert('Error!'); } finally { setIsGenerating(false); }
  };

  return (
    <div className="space-y-4">
      <div ref={ticketRef} className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xl">
        <div className="bg-red-600 p-6 text-white text-center">
          <h3 className="text-sm font-black uppercase tracking-widest">E-Ticket Ekspedisi</h3>
          <p className="text-[8px] font-bold opacity-50 mt-1">ID: #{registration.id.toString().slice(-8)}</p>
        </div>
        <div className="p-8 grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block">Nama</span>
            <p className="text-xs font-black uppercase">{registration.fullName}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block">Tujuan</span>
            <p className="text-xs font-black uppercase text-red-600">{registration.mountain}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block">Tanggal</span>
            <p className="text-[10px] font-bold">{registration.startDate}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block">Status</span>
            <p className="text-[10px] font-black uppercase text-green-600">{registration.status}</p>
          </div>
        </div>
      </div>
      <button onClick={handleDownloadPDF} className="w-full py-4 bg-stone-900 dark:bg-stone-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Unduh PDF</button>
    </div>
  );
};

export default ETicketCard;
