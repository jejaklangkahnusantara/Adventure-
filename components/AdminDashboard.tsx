
import React, { useMemo, useState, useEffect } from 'react';
import { Registration, AdminSettings, FormConfig } from '../types';
import * as XLSX from 'xlsx';
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
  onSettingsUpdate?: (settings: AdminSettings) => void;
  onLogout?: () => void;
  isDarkMode?: boolean;
}

const SETTINGS_KEY = 'jejak_langkah_admin_settings';

const defaultSettings: AdminSettings = {
  adminEmail: 'jejaklangkah.nusantara.id@gmail.com',
  adminPassword: 'admin123',
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
  enableAiSummary: true,
  formConfig: {
    mountains: ["Gunung Semeru", "Gunung Rinjani", "Gunung Prau", "Gunung Seminung", "Gunung Pesagi", "Gunung Kerinci", "Gunung Merbabu", "Gunung Gede", "Gunung Lawu"],
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
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-stone-900 dark:bg-blue-800 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl z-[100]">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[4px] border-transparent border-t-stone-900 dark:border-t-blue-800"></div>
    </div>
  </div>
);

const AdminDashboard: React.FC<DashboardProps> = ({ data, onUpdateStatus, onSettingsUpdate, onLogout, isDarkMode }) => {
  const [activeSubTab, setActiveTab] = useState<'overview' | 'table' | 'settings'>('overview');
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings({ ...defaultSettings, ...parsed });
    }
  }, []);

  const handleSaveSettings = (newSettings?: AdminSettings) => {
    const s = newSettings || settings;
    setSaveStatus('saving');
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    onSettingsUpdate?.(s);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
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

  const toggleStatusTrigger = (status: string) => {
    setSettings(prev => ({
      ...prev,
      notificationPrefs: {
        ...prev.notificationPrefs,
        statusTriggers: {
          ...prev.notificationPrefs.statusTriggers,
          [status]: !prev.notificationPrefs.statusTriggers[status]
        }
      }
    }));
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
    return { total: data.length };
  }, [data]);

  const generateAppsScriptCode = () => {
    return `/**
 * BACKEND JEJAK LANGKAH ADVENTURE (V14 - SMART SYNC & NOTIF)
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
      sheet.appendRow(["TIMESTAMP", "ID_BOOKING", "NAMA_LENGKAP", "WHATSAPP", "EMAIL", "GUNUNG", "GENDER", "TGL_MULAI", "TGL_SELESAI", "TRIP", "PAKET", "ALAMAT", "CATATAN_MEDIS", "STATUS"]);
      sheet.getRange(1, 1, 1, 14).setBackground("#b91c1c").setFontColor("white").setFontWeight("bold");
    }

    if (data.action === "TEST_CONNECTION") {
      try { MailApp.sendEmail(data.adminEmail, "✅ CLOUD CONNECTED", "Sistem Jejak Langkah Berhasil Terhubung V14 pada " + data.timestamp); } catch(f) {}
      return ContentService.createTextOutput("success").setMimeType(ContentService.MimeType.TEXT);
    }

    if (data.action === "NEW_REGISTRATION") {
      var r = data.registration;
      var prefs = data.notificationPrefs || {};
      sheet.appendRow([r.timestamp, "ID_"+r.id.toString().slice(-6), r.fullName, "'" + r.whatsapp, r.email, r.mountain, r.gender || "-", r.startDate, r.endDate, r.tripType, r.packageCategory, r.address, r.medicalNotes, r.status]);
      
      if (prefs.notifyAdminOnNew && data.adminEmail) {
        try { MailApp.sendEmail(data.adminEmail, "🚨 PENDAFTARAN BARU: " + r.fullName, "Ada pendaftaran baru untuk ekspedisi " + r.mountain); } catch(f) {}
      }

      if (prefs.notifyUserOnNew && r.email) {
        try { MailApp.sendEmail(r.email, "Konfirmasi Pendaftaran: " + r.mountain, "Halo " + r.fullName + ",\\n\\nTerima kasih telah mendaftar ekspedisi ke " + r.mountain + " bersama Jejak Langkah Adventure.\\n\\nNomor Booking: #" + r.id.toString().slice(-6) + "\\n\\nSalam Petualang."); } catch(f) {}
      }
      return ContentService.createTextOutput("success").setMimeType(ContentService.MimeType.TEXT);
    }

    if (data.action === "STATUS_UPDATE") {
      var r = data.registration;
      var searchId = "ID_" + r.id.toString().slice(-6);
      var values = sheet.getDataRange().getValues();
      var foundRow = -1;
      
      // Cari baris berdasarkan ID_BOOKING
      for (var i = 1; i < values.length; i++) {
        if (values[i][1] == searchId) {
          foundRow = i + 1;
          break;
        }
      }
      
      // Update status di spreadsheet (Kolom 14)
      if (foundRow !== -1) {
        sheet.getRange(foundRow, 14).setValue(data.newStatus);
      }

      // Kirim Email jika trigger aktif
      if (data.shouldNotify && r.email) {
         try {
           MailApp.sendEmail(r.email, "Update Status Pendakian: " + data.newStatus, 
             "Halo " + r.fullName + ",\\n\\nStatus pendaftaran Anda untuk ekspedisi " + r.mountain + " telah diperbarui menjadi: " + data.newStatus + ".\\n\\nTerima kasih.\\nJejak Langkah Adventure");
         } catch(f) {}
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
      return matchSearch;
    });
  }, [data, search]);

  const isConfigured = !!settings.googleScriptUrl;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-blue-800 p-4 border border-stone-100 dark:border-blue-700 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black uppercase text-stone-400 dark:text-blue-200 mb-1 tracking-widest">{label}</p>
          <p className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-tighter">
            {payload[0].value} Pendaftar
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      {!isConfigured && activeSubTab !== 'settings' && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-amber-500 rounded-full animate-ping"></span>
            <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">Peringatan: Cloud Belum Aktif. Data tidak akan masuk ke Spreadsheet.</p>
          </div>
          <button onClick={() => setActiveTab('settings')} className="text-[9px] font-black text-amber-900 dark:text-amber-200 underline uppercase">Atur</button>
        </div>
      )}

      <div className="flex justify-between items-center bg-white dark:bg-blue-900 p-4 rounded-2xl border border-stone-200 dark:border-blue-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <TooltipWrapper text="Panel Kendali Utama">
            <div className="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </div>
          </TooltipWrapper>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-stone-800 dark:text-white">Control Center</h2>
            <p className="text-[9px] text-stone-400 dark:text-blue-300 font-bold uppercase tracking-tighter">Status: <span className={isConfigured ? 'text-green-600' : 'text-red-500'}>{isConfigured ? 'Online' : 'Offline'}</span></p>
          </div>
        </div>
        <TooltipWrapper text="Keluar dari Sesi Admin">
          <button onClick={onLogout} className="px-5 py-2.5 bg-stone-50 dark:bg-blue-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-stone-500 dark:text-blue-200 hover:text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Keluar</button>
        </TooltipWrapper>
      </div>

      <div className="flex border-b border-stone-200 dark:border-blue-800 gap-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'table', label: 'Daftar Peserta' },
          { id: 'settings', label: 'Konfigurasi Sistem' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'border-red-600 text-red-700 dark:text-red-400' : 'border-transparent text-stone-400 hover:text-stone-600 dark:text-blue-300/40 dark:hover:text-blue-100'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="bg-white dark:bg-blue-900 p-6 rounded-[2rem] border border-stone-100 dark:border-blue-800 shadow-sm flex flex-col gap-2">
              <span className="text-[10px] font-black text-stone-400 dark:text-blue-300/60 uppercase tracking-widest">Total Pendaftar Masuk</span>
              <span className="text-4xl font-black text-stone-800 dark:text-white tracking-tighter">{stats.total} Peserta</span>
            </div>
          </div>

          <section className="bg-white dark:bg-blue-900 p-8 rounded-[3rem] border border-stone-100 dark:border-blue-800 shadow-xl space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800 dark:text-white leading-none">Popularitas Destinasi</h3>
                <p className="text-[10px] font-bold text-stone-400 dark:text-blue-300 uppercase tracking-widest mt-2">Distribusi pendaftar per gunung</p>
              </div>
            </div>
            
            <div className="h-[400px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e3a8a" : "#f1f1f1"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: isDarkMode ? "#93c5fd" : "#a8a29e" }} interval={0} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: isDarkMode ? "#60a5fa" : "#a8a29e" }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#b91c1c" : (isDarkMode ? "#1e40af" : "#f5f5f4")} className="transition-all duration-300 hover:fill-red-700" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-10">
          <section className="bg-white dark:bg-blue-900 rounded-[2.5rem] border border-stone-100 dark:border-blue-800 shadow-xl overflow-hidden transition-colors">
            <div className="p-8 border-b border-stone-50 dark:border-blue-800 bg-stone-50/50 dark:bg-blue-950/30 flex items-center gap-4">
              <TooltipWrapper text="Konfigurasi Database Spreadsheet">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-xl">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
              </TooltipWrapper>
              <div>
                <h4 className="text-[10px] font-black text-stone-400 dark:text-blue-300 uppercase tracking-[0.2em]">Koneksi Cloud</h4>
                <p className="text-[9px] font-bold text-stone-500 dark:text-blue-400 uppercase">Integrasi Google Spreadsheet</p>
              </div>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 dark:text-blue-300 uppercase tracking-widest px-1">Web App URL</label>
                  <input type="text" value={settings.googleScriptUrl} onChange={(e) => setSettings(p => ({ ...p, googleScriptUrl: e.target.value }))} placeholder="https://script.google.com/macros/s/.../exec" className="w-full px-5 py-4 bg-stone-50 dark:bg-blue-800/50 border border-stone-200 dark:border-blue-700 rounded-2xl text-xs font-bold text-stone-800 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 dark:text-blue-300 uppercase tracking-widest px-1">Email Admin</label>
                  <input type="email" value={settings.adminEmail} onChange={(e) => setSettings(p => ({ ...p, adminEmail: e.target.value }))} className="w-full px-5 py-4 bg-stone-50 dark:bg-blue-800/50 border border-stone-200 dark:border-blue-700 rounded-2xl text-xs font-bold text-stone-800 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <button onClick={handleTestConnection} disabled={testStatus === 'sending'} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${testStatus === 'success' ? 'bg-green-600 text-white' : testStatus === 'error' ? 'bg-red-600 text-white' : 'bg-blue-700 text-white hover:scale-105 active:scale-95'}`}>{testStatus === 'sending' ? 'Mengirim...' : testStatus === 'success' ? 'Berhasil Terhubung' : testStatus === 'error' ? 'Koneksi Gagal' : 'Uji Koneksi'}</button>
                <button onClick={() => setShowScriptModal(true)} className="px-6 py-4 bg-stone-900 dark:bg-blue-700 text-white dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Script Backend</button>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-blue-900 rounded-[2.5rem] border border-stone-100 dark:border-blue-800 shadow-xl overflow-hidden transition-colors">
            <div className="p-8 border-b border-stone-50 dark:border-blue-800 bg-stone-50/50 dark:bg-blue-950/30 flex items-center gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-xl">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-stone-400 dark:text-blue-300 uppercase tracking-[0.2em]">Pengaturan Notifikasi</h4>
                <p className="text-[9px] font-bold text-stone-500 dark:text-blue-400 uppercase">Konfigurasi Email Otomatis</p>
              </div>
            </div>
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h5 className="text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest border-b pb-2">Pendaftaran Baru</h5>
                   <div className="flex items-center justify-between group">
                      <span className="text-[10px] font-bold text-stone-700 dark:text-blue-100 uppercase">Notifikasi ke Admin</span>
                      <button 
                        onClick={() => setSettings(prev => ({...prev, notificationPrefs: {...prev.notificationPrefs, notifyAdminOnNew: !prev.notificationPrefs.notifyAdminOnNew}}))}
                        className={`w-10 h-5 rounded-full transition-all relative ${settings.notificationPrefs.notifyAdminOnNew ? 'bg-red-600' : 'bg-stone-200 dark:bg-blue-800'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.notificationPrefs.notifyAdminOnNew ? 'left-5.5' : 'left-0.5'}`}></div>
                      </button>
                   </div>
                   <div className="flex items-center justify-between group">
                      <span className="text-[10px] font-bold text-stone-700 dark:text-blue-100 uppercase">Email Konfirmasi User</span>
                      <button 
                        onClick={() => setSettings(prev => ({...prev, notificationPrefs: {...prev.notificationPrefs, notifyUserOnNew: !prev.notificationPrefs.notifyUserOnNew}}))}
                        className={`w-10 h-5 rounded-full transition-all relative ${settings.notificationPrefs.notifyUserOnNew ? 'bg-red-600' : 'bg-stone-200 dark:bg-blue-800'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.notificationPrefs.notifyUserOnNew ? 'left-5.5' : 'left-0.5'}`}></div>
                      </button>
                   </div>
                </div>

                <div className="space-y-4">
                   <h5 className="text-[9px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-widest border-b pb-2">Email Perubahan Status</h5>
                   {["Terverifikasi", "Diproses", "Dibatalkan"].map(status => (
                     <div key={status} className="flex items-center justify-between group">
                        <span className="text-[10px] font-bold text-stone-700 dark:text-blue-100 uppercase">Status: {status}</span>
                        <button 
                          onClick={() => toggleStatusTrigger(status)}
                          className={`w-10 h-5 rounded-full transition-all relative ${settings.notificationPrefs.statusTriggers[status] ? 'bg-red-600' : 'bg-stone-200 dark:bg-blue-800'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.notificationPrefs.statusTriggers[status] ? 'left-5.5' : 'left-0.5'}`}></div>
                        </button>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </section>

          <div className="flex gap-4 pt-4">
            <button onClick={() => handleSaveSettings()} className="flex-1 py-5 bg-red-700 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all">
              {saveStatus === 'saving' ? 'Memproses...' : saveStatus === 'saved' ? 'Sistem Terupdate!' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'table' && (
        <div className="bg-white dark:bg-blue-900 rounded-[2.5rem] border border-stone-200 dark:border-blue-800 shadow-xl overflow-hidden transition-colors">
           <div className="p-6 border-b border-stone-50 dark:border-blue-800 flex flex-col md:flex-row items-center gap-4 bg-stone-50/50 dark:bg-blue-950/30">
             <div className="relative flex-1 w-full">
                <input type="text" placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-6 py-4 bg-white dark:bg-blue-800 border border-stone-100 dark:border-blue-700 rounded-2xl text-xs font-bold outline-none transition-all dark:text-white" />
             </div>
             <button onClick={() => { const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Participants"); XLSX.writeFile(wb, "Data_Peserta.xlsx"); }} className="px-6 py-4 bg-stone-900 dark:bg-blue-700 text-white dark:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all">Export Excel</button>
           </div>
           <div className="overflow-x-auto no-scrollbar">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-stone-50/50 dark:bg-blue-950/50 border-b border-stone-100 dark:border-blue-800">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-blue-300/40">ID & Waktu</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-blue-300/40">Peserta</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-blue-300/40">Tujuan</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-blue-300/40">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-stone-50 dark:divide-blue-800">
                 {filteredData.length === 0 ? (
                   <tr><td colSpan={4} className="px-8 py-20 text-center text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 dark:text-blue-300/20">Data Kosong</td></tr>
                 ) : filteredData.map(reg => (
                   <tr key={reg.id} className="hover:bg-stone-50/50 dark:hover:bg-blue-800/30 transition-colors">
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-stone-400 dark:text-blue-300/40 uppercase tracking-tighter">#{reg.id.toString().slice(-6)}</span>
                          <span className="text-[9px] font-bold text-stone-300 dark:text-blue-400/30 mt-1">{reg.timestamp}</span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase text-stone-800 dark:text-blue-50 tracking-tight">{reg.fullName}</span>
                          <span className="text-[10px] font-bold text-stone-400 dark:text-blue-300/60 mt-1">{reg.whatsapp}</span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase text-red-700 dark:text-red-400 tracking-tight">{reg.mountain}</span>
                          <span className="text-[10px] font-bold text-stone-400 dark:text-blue-300/60 mt-1">{reg.tripType}</span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <select 
                          value={reg.status} 
                          onChange={(e) => onUpdateStatus?.(reg.id, e.target.value)}
                          className="text-[9px] font-black uppercase bg-stone-100 dark:bg-blue-800 px-3 py-1.5 rounded-lg border-none outline-none focus:ring-2 focus:ring-red-500 cursor-pointer dark:text-white"
                        >
                           <option value="Menunggu Verifikasi">Pending</option>
                           <option value="Terverifikasi">Terverifikasi</option>
                           <option value="Diproses">Diproses</option>
                           <option value="Dibatalkan">Dibatalkan</option>
                        </select>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {showScriptModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-blue-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-blue-900 w-full max-w-4xl rounded-[3rem] shadow-2xl border border-stone-200 dark:border-blue-800 flex flex-col max-h-[90vh] transition-colors">
            <div className="p-10 border-b border-stone-50 dark:border-blue-800 flex justify-between items-center bg-stone-50/30 dark:bg-blue-950/30">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 dark:text-white">Backend V14 (Smart Sync)</h3>
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase mt-1 tracking-widest">Update kode ini di Google Script agar status peserta sinkron otomatis dengan spreadsheet.</p>
              </div>
              <button onClick={() => setShowScriptModal(false)} className="w-12 h-12 flex items-center justify-center bg-stone-100 dark:bg-blue-800 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-2xl transition-all dark:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 dark:text-blue-300/40">Source Code (V14)</h4>
                  <button onClick={() => { navigator.clipboard.writeText(generateAppsScriptCode()); alert("Kode Tersalin!"); }} className="px-4 py-2 bg-red-700 text-white text-[9px] font-black uppercase rounded-xl hover:scale-105 transition-all shadow-lg shadow-red-900/20">Salin Kode</button>
                </div>
                <div className="relative group">
                  <pre className="p-8 bg-stone-900 dark:bg-blue-950 text-green-400 dark:text-green-300 rounded-3xl text-[10px] font-mono overflow-x-auto leading-relaxed h-[400px] border border-stone-800 dark:border-blue-800">
                    {generateAppsScriptCode()}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-10 border-t border-stone-50 dark:border-blue-800"><button onClick={() => setShowScriptModal(false)} className="w-full py-5 bg-stone-900 dark:bg-blue-700 text-white dark:text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-[2rem] shadow-xl">Tutup</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
