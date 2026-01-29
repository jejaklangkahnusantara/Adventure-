
import React, { useMemo, useState, useEffect } from 'react';
import { Registration, AdminSettings, FormConfig } from '../types';
import * as XLSX from 'xlsx';
import Input from './Input';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  data: Registration[];
  onUpdateStatus?: (id: number, newStatus: string) => void;
  onUpdateRegistrations?: (updated: Registration[]) => void;
  onSettingsUpdate?: (settings: AdminSettings) => void;
  onLogout?: () => void;
  onClearAll?: () => void;
  isDarkMode?: boolean;
}

const SETTINGS_KEY = 'jejak_langkah_admin_settings';

const defaultSettings: AdminSettings = {
  adminEmail: 'jejaklangkah.nusantara.id@gmail.com',
  adminUsername: 'Jejak Langkah',
  adminPassword: 'JejakLangkah25',
  googleScriptUrl: '',
  notifyUser: true,
  notificationPrefs: {
    notifyAdminOnNew: true,
    notifyUserOnNew: true,
    statusTriggers: {
      "Terverifikasi": true,
      "Diproses": false,
      "Dibatalkan": true
    }
  },
  enableAiSummary: false,
  formConfig: {
    mountains: [
      "Gunung Semeru", "Gunung Rinjani", "Gunung Prau", "Gunung Seminung", 
      "Gunung Pesagi", "Gunung Kerinci", "Gunung Merbabu", "Gunung Gede", 
      "Gunung Lawu", "Gunung Slamet", "Gunung Sumbing", "Gunung Sindoro", 
      "Gunung Dempo", "Gunung Tanggamus", "Gunung Pesawaran", "Gunung Ratai", 
      "Gunung Kembang"
    ],
    tripTypes: ["Private Trip", "Open Trip", "Share Cost"],
    packageCategories: ["REGULER", "Paket A", "Paket B"]
  },
  bankAccounts: {
    bankName: "BRI",
    accountNumber: "570401009559504",
    accountName: "ILHAM FADHILAH"
  }
};

const TooltipWrapper: React.FC<{ children: React.ReactNode; text: string }> = ({ children, text }) => (
  <div className="relative group flex items-center">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-stone-900 dark:bg-stone-800 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl z-[100]">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[4px] border-transparent border-t-stone-900 dark:border-t-stone-800"></div>
    </div>
  </div>
);

const AdminDashboard: React.FC<DashboardProps> = ({ data, onUpdateStatus, onUpdateRegistrations, onSettingsUpdate, onLogout, onClearAll, isDarkMode }) => {
  const [activeSubTab, setActiveTab] = useState<'overview' | 'table' | 'settings'>('overview');
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<AdminSettings>(defaultSettings);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = { ...defaultSettings, ...parsed };
      setSettings(merged);
      setOriginalSettings(merged);
    }
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  const handleSaveSettings = (newSettings?: AdminSettings) => {
    const s = newSettings || settings;
    setSaveStatus('saving');
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    onSettingsUpdate?.(s);
    setTimeout(() => {
      setSaveStatus('saved');
      setOriginalSettings(s);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const syncToCloud = async (reg: Registration) => {
    if (!settings.googleScriptUrl) return false;
    try {
      await fetch(settings.googleScriptUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'NEW_REGISTRATION',
          registration: reg,
          adminEmail: settings.adminEmail,
          notificationPrefs: settings.notificationPrefs
        })
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleManualSync = async (id: number) => {
    setSyncingId(id);
    const reg = data.find(r => r.id === id);
    if (reg) {
      const success = await syncToCloud(reg);
      if (success && onUpdateRegistrations) {
        onUpdateRegistrations(data.map(r => r.id === id ? { ...r, isSynced: true } : r));
      }
    }
    setSyncingId(null);
  };

  const handleSyncAll = async () => {
    if (!settings.googleScriptUrl) return alert("URL Cloud belum diatur!");
    setIsSyncingAll(true);
    const unsynced = data.filter(r => !r.isSynced);
    
    let updatedData = [...data];
    for (const reg of unsynced) {
      const success = await syncToCloud(reg);
      if (success) {
        updatedData = updatedData.map(r => r.id === reg.id ? { ...r, isSynced: true } : r);
      }
    }
    
    onUpdateRegistrations?.(updatedData);
    setIsSyncingAll(false);
    alert("Proses sinkronisasi selesai.");
  };

  const handleTestConnection = async () => {
    const url = settings.googleScriptUrl?.trim();
    if (!url) return alert("Masukkan URL Google Script terlebih dahulu!");
    
    setTestStatus('sending');
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'TEST_CONNECTION',
          adminEmail: settings.adminEmail,
          timestamp: new Date().toLocaleString()
        })
      });
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 4000);
    } catch (e) {
      console.error(e);
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 4000);
    }
  };

  const chartData = useMemo(() => {
    const mountainCounts: Record<string, number> = {};
    const allMountains = settings.formConfig.mountains;
    allMountains.forEach(m => { mountainCounts[m] = 0; });
    data.forEach(reg => {
      if (mountainCounts[reg.mountain] !== undefined) {
        mountainCounts[reg.mountain]++;
      } else {
        mountainCounts[reg.mountain] = 1;
      }
    });
    return Object.entries(mountainCounts)
      .map(([name, count]) => ({ 
        name: name.replace('Gunung ', ''), 
        count 
      }))
      .sort((a, b) => b.count - a.count);
  }, [data, settings.formConfig.mountains]);

  const stats = useMemo(() => {
    return { total: data.length, unsynced: data.filter(r => !r.isSynced).length };
  }, [data]);

  const generateAppsScriptCode = () => {
    return `/**
 * BACKEND JEJAK LANGKAH ADVENTURE (V16 - CLOUD SYNC)
 * PENTING: Deploy sebagai Web App, Access: "Anyone"
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); 
  
  try {
    var body = e.postData.contents;
    var data = JSON.parse(body);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    
    if (sheet.getLastRow() == 0) {
      sheet.appendRow(["TIMESTAMP", "ID_BOOKING", "NAMA_LENGKAP", "WHATSAPP", "EMAIL", "GUNUNG", "TGL_MULAI", "TGL_SELESAI", "TRIP", "PAKET", "ALAMAT", "STATUS"]);
      sheet.getRange(1, 1, 1, 12).setBackground("#e11d48").setFontColor("white").setFontWeight("bold");
    }

    if (data.action === "TEST_CONNECTION") {
      try { MailApp.sendEmail(data.adminEmail, "✅ CLOUD CONNECTED - Jejak Langkah", "Sistem Jejak Langkah Adventure Berhasil Terhubung pada " + data.timestamp); } catch(f) {}
      return ContentService.createTextOutput("success").setMimeType(ContentService.MimeType.TEXT);
    }

    if (data.action === "NEW_REGISTRATION") {
      var r = data.registration;
      var bookingId = "JL-" + r.id.toString().slice(-6).toUpperCase();
      
      // Duplication check
      var values = sheet.getDataRange().getValues();
      var exists = false;
      for (var i = 1; i < values.length; i++) {
        if (values[i][1] == bookingId) { exists = true; break; }
      }

      if (!exists) {
        sheet.appendRow([r.timestamp, bookingId, r.fullName, "'" + r.whatsapp, r.email, r.mountain, r.startDate, r.endDate, r.tripType, r.packageCategory, r.address, r.status]);
        
        // Notifications
        try {
          if (data.notificationPrefs.notifyUserOnNew && r.email) {
            MailApp.sendEmail(r.email, "Konfirmasi Pendaftaran Ekspedisi [" + bookingId + "]", "Halo " + r.fullName + ", pendaftaran Anda untuk " + r.mountain + " telah kami terima.");
          }
          if (data.notificationPrefs.notifyAdminOnNew && data.adminEmail) {
            MailApp.sendEmail(data.adminEmail, "🚨 PENDAFTARAN BARU: " + r.fullName, "Detail: " + r.mountain + " [" + bookingId + "]");
          }
        } catch(mailErr) {}
      }

      return ContentService.createTextOutput("success").setMimeType(ContentService.MimeType.TEXT);
    }
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}`;
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = !search || item.fullName.toLowerCase().includes(search.toLowerCase()) || item.whatsapp.includes(search);
      let matchDate = true;
      if (dateStart && item.startDate < dateStart) matchDate = false;
      if (dateEnd && item.startDate > dateEnd) matchDate = false;
      return matchSearch && matchDate;
    });
  }, [data, search, dateStart, dateEnd]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <TooltipWrapper text="Panel Kendali Utama">
            <div className="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </div>
          </TooltipWrapper>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-stone-800 dark:text-white">Control Center</h2>
            <p className="text-[9px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-tighter">Status Cloud: <span className={!!settings.googleScriptUrl ? 'text-green-600' : 'text-red-500'}>{!!settings.googleScriptUrl ? 'Tersambung' : 'Terputus'}</span></p>
          </div>
        </div>
        <div className="flex gap-4">
          {stats.unsynced > 0 && (
            <button 
              onClick={handleSyncAll} 
              disabled={isSyncingAll || !settings.googleScriptUrl}
              className="px-5 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-accent/20 animate-pulse hover:animate-none flex items-center gap-2"
            >
              {isSyncingAll ? 'Sinkronisasi...' : `Sinkron ${stats.unsynced} Data`}
            </button>
          )}
          <TooltipWrapper text="Keluar dari Sesi Admin">
            <button onClick={onLogout} className="px-5 py-2.5 bg-stone-50 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-500 dark:text-stone-400 hover:text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Keluar</button>
          </TooltipWrapper>
        </div>
      </div>

      <div className="flex border-b border-stone-200 dark:border-stone-800 gap-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'table', label: 'Daftar Peserta' },
          { id: 'settings', label: 'Konfigurasi' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'border-red-600 text-red-700 dark:text-red-400' : 'border-transparent text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'}`}>{tab.label}</button>
        ))}
      </div>

      {activeSubTab === 'table' && (
        <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden transition-colors">
           <div className="p-6 border-b border-stone-50 dark:border-stone-800 flex flex-col gap-6 bg-stone-50/50 dark:bg-stone-800/30">
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
               <div className="md:col-span-5 relative">
                  <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1.5 ml-1">Cari Nama / WhatsApp</span>
                  <input type="text" placeholder="Ketik nama peserta..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-5 py-3.5 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-xs font-bold outline-none transition-all dark:text-white focus:ring-2 focus:ring-red-500/20" />
               </div>
               <div className="md:col-span-3">
                  <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1.5 ml-1">Dari Tanggal</span>
                  <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full px-5 py-3.5 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-xs font-bold outline-none transition-all dark:text-white focus:ring-2 focus:ring-red-500/20" />
               </div>
               <div className="md:col-span-3">
                  <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 block mb-1.5 ml-1">Sampai Tanggal</span>
                  <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full px-5 py-3.5 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-xs font-bold outline-none transition-all dark:text-white focus:ring-2 focus:ring-red-500/20" />
               </div>
               <div className="md:col-span-1 flex items-end">
                  <button onClick={() => { setDateStart(''); setDateEnd(''); setSearch(''); }} className="w-full h-[46px] flex items-center justify-center bg-stone-100 dark:bg-stone-700 rounded-xl hover:bg-stone-200 transition-all">
                    <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
             </div>
           </div>
           
           <div className="overflow-x-auto no-scrollbar">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-stone-50/50 dark:bg-stone-950/50 border-b border-stone-100 dark:border-stone-800">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500/40">ID & Cloud</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500/40">Peserta</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500/40">Tujuan & Tgl Trip</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500/40">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                 {filteredData.length === 0 ? (
                   <tr><td colSpan={4} className="px-8 py-20 text-center text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 dark:text-stone-500/20">Tidak ada data</td></tr>
                 ) : filteredData.map(reg => (
                   <tr key={reg.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-stone-400 dark:text-stone-500/40 uppercase tracking-tighter">#{reg.id.toString().slice(-6)}</span>
                            <span className="text-[9px] font-bold text-stone-300 dark:text-stone-500/30 mt-1">{reg.timestamp}</span>
                          </div>
                          {reg.isSynced ? (
                             <TooltipWrapper text="Sudah Sinkron">
                               <div className="w-8 h-8 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center">
                                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V11h2.5a2.5 2.5 0 100-5h-.027a1 1 0 01-.952-.683 2 2 0 10-3.725 0 1 1 0 01-.952.683H7.5a1.5 1.5 0 100 3H9v2H7.5a3.5 3.5 0 01-2-6.5V13z" /><path d="M10 13l-3-3h2V3h2v7h2l-3 3z" /></svg>
                               </div>
                             </TooltipWrapper>
                          ) : (
                             <TooltipWrapper text="Belum Sinkron - Klik untuk Sync">
                               <button 
                                 disabled={syncingId === reg.id || !settings.googleScriptUrl}
                                 onClick={() => handleManualSync(reg.id)}
                                 className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-red-500/20"
                               >
                                 {syncingId === reg.id ? (
                                   <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                 ) : (
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                 )}
                               </button>
                             </TooltipWrapper>
                          )}
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase text-stone-800 dark:text-white tracking-tight">{reg.fullName}</span>
                          <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500/60 mt-1">{reg.whatsapp}</span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase text-red-700 dark:text-red-400 tracking-tight">{reg.mountain}</span>
                          <span className="text-[9px] font-black text-stone-400 uppercase mt-1 tracking-widest">{reg.startDate} — {reg.tripType}</span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <select 
                          value={reg.status} 
                          onChange={(e) => onUpdateStatus?.(reg.id, e.target.value)}
                          className="text-[9px] font-black uppercase bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg border-none outline-none focus:ring-2 focus:ring-red-500 cursor-pointer dark:text-white"
                        >
                          <option value="Menunggu Verifikasi">Pending</option>
                          <option value="Terverifikasi">Approve</option>
                          <option value="Diproses">Process</option>
                          <option value="Dibatalkan">Reject</option>
                        </select>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
          <section className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-xl overflow-hidden transition-colors">
            <div className="p-8 border-b border-stone-50 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center gap-4">
              <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl">
                <svg className="w-5 h-5 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">Koneksi Cloud</h4>
                <p className="text-[9px] font-bold text-stone-500 dark:text-stone-400 uppercase">Integrasi Google Spreadsheet</p>
              </div>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input label="Web App URL" value={settings.googleScriptUrl} onChange={(e) => setSettings(p => ({ ...p, googleScriptUrl: e.target.value }))} placeholder="https://script.google.com/macros/s/.../exec" />
                <Input label="Email Admin Notifikasi" type="email" value={settings.adminEmail} onChange={(e) => setSettings(p => ({ ...p, adminEmail: e.target.value }))} />
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <button onClick={handleTestConnection} disabled={testStatus === 'sending'} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${testStatus === 'success' ? 'bg-green-600 text-white' : testStatus === 'error' ? 'bg-red-600 text-white' : 'bg-red-700 text-white hover:scale-105 active:scale-95'}`}>{testStatus === 'sending' ? 'Mengirim...' : testStatus === 'success' ? 'Berhasil Terhubung' : testStatus === 'error' ? 'Koneksi Gagal' : 'Uji Koneksi Cloud'}</button>
                <button onClick={() => setShowScriptModal(true)} className="px-6 py-4 bg-stone-900 dark:bg-stone-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Dapatkan Script Cloud</button>
              </div>
            </div>
          </section>

          {isDirty && (
            <div className="flex gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button onClick={() => handleSaveSettings()} className="flex-1 py-5 bg-red-700 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all">{saveStatus === 'saving' ? 'Memproses...' : 'Simpan Konfigurasi'}</button>
            </div>
          )}
        </div>
      )}

      {showScriptModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-stone-900 w-full max-w-4xl rounded-[3rem] shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[90vh] transition-colors">
            <div className="p-10 border-b border-stone-50 dark:border-stone-800 flex justify-between items-center bg-stone-50/30 dark:bg-stone-950/30">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 dark:text-white">Cloud Backend V16</h3>
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase mt-1 tracking-widest">Gunakan kode ini di Google Apps Script untuk menghubungkan form ke spreadsheet.</p>
              </div>
              <button onClick={() => setShowScriptModal(false)} className="w-12 h-12 flex items-center justify-center bg-stone-100 dark:bg-stone-800 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-2xl transition-all dark:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 dark:text-stone-500/40">Langkah-langkah:</h4>
                  <button onClick={() => { navigator.clipboard.writeText(generateAppsScriptCode()); alert("Kode Tersalin!"); }} className="px-4 py-2 bg-red-700 text-white text-[9px] font-black uppercase rounded-xl hover:scale-105 transition-all shadow-lg shadow-red-900/20">Salin Kode</button>
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium space-y-2 leading-relaxed">
                  <p>1. Buka <strong>Google Sheets</strong> Anda.</p>
                  <p>2. Klik <strong>Extensions</strong> > <strong>Apps Script</strong>.</p>
                  <p>3. Hapus semua kode bawaan dan tempel kode di bawah ini.</p>
                  <p>4. Klik <strong>Deploy</strong> > <strong>New Deployment</strong>.</p>
                  <p>5. Pilih type: <strong>Web App</strong>. Set "Who has access" ke <strong>Anyone</strong>.</p>
                  <p>6. Salin URL Web App dan tempel di pengaturan dashboard ini.</p>
                </div>
                <pre className="p-8 bg-stone-900 dark:bg-stone-950 text-green-400 rounded-3xl text-[10px] font-mono overflow-x-auto leading-relaxed h-[400px] border border-stone-800 dark:border-stone-800">
                  {generateAppsScriptCode()}
                </pre>
              </div>
            </div>
            <div className="p-10 border-t border-stone-50 dark:border-stone-800"><button onClick={() => setShowScriptModal(false)} className="w-full py-5 bg-stone-900 dark:bg-stone-800 text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-[2rem] shadow-xl">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
