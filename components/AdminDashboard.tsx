
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

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between p-4 bg-stone-50 dark:bg-slate-800/40 rounded-2xl cursor-pointer group hover:bg-stone-100 dark:hover:bg-slate-800 transition-all border border-stone-100 dark:border-stone-800">
    <span className="text-[10px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-400">{label}</span>
    <div className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent rounded-full"></div>
    </div>
  </label>
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
  const [syncProgress, setSyncProgress] = useState(0);

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

  const handleExportCSV = () => {
    if (data.length === 0) return alert("Tidak ada data untuk diunduh.");
    
    const exportData = data.map(r => ({
      ID: `JL-${r.id.toString().slice(-6).toUpperCase()}`,
      Timestamp: r.timestamp,
      Nama_Lengkap: r.fullName,
      WhatsApp: `'${r.whatsapp}`,
      Email: r.email,
      Gunung: r.mountain,
      Tgl_Mulai: r.startDate,
      Tgl_Selesai: r.endDate,
      Tipe_Trip: r.tripType,
      Kategori: r.packageCategory,
      Alamat: r.address.replace(/\n/g, " "),
      Status: r.status,
      Synced_Cloud: r.isSynced ? "YES" : "NO"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `JEJAK_LANGKAH_DATA_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const syncToCloud = async (reg: Registration) => {
    if (!settings.googleScriptUrl) return false;
    const url = settings.googleScriptUrl.trim();
    if (!url.includes('/exec')) {
      alert("Peringatan: URL Script harus diakhiri dengan /exec. Periksa kembali deployment Anda.");
      return false;
    }

    try {
      const { identityFile, ...cloudReg } = reg;
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'NEW_REGISTRATION',
          registration: cloudReg,
          adminEmail: settings.adminEmail,
          notificationPrefs: settings.notificationPrefs
        })
      });
      return true;
    } catch (e) {
      console.error("Cloud sync error:", e);
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
    setSyncProgress(0);
    const unsynced = data.filter(r => !r.isSynced);
    
    let updatedData = [...data];
    let count = 0;
    for (const reg of unsynced) {
      const success = await syncToCloud(reg);
      if (success) {
        updatedData = updatedData.map(r => r.id === reg.id ? { ...r, isSynced: true } : r);
      }
      count++;
      setSyncProgress(Math.round((count / unsynced.length) * 100));
    }
    
    onUpdateRegistrations?.(updatedData);
    setIsSyncingAll(false);
    setTimeout(() => setSyncProgress(0), 1000);
    alert("Proses sinkronisasi selesai.");
  };

  const handleTestConnection = async () => {
    const url = settings.googleScriptUrl?.trim();
    if (!url) return alert("Masukkan URL Google Script terlebih dahulu!");
    if (!url.includes('/exec')) return alert("URL Salah! Harus URL /exec (Web App)");

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

  const generateAppsScriptCode = () => {
    return `/**
 * BACKEND JEJAK LANGKAH ADVENTURE (V17.5 - ROBUST CLOUD)
 * UPDATE: Optimalisasi payload, penanganan limit Google Sheets, dan GmailApp.
 * PENTING: Deploy sebagai Web App, Access: "Anyone", Execute as: "Me"
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); // Wait up to 30s
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput("Error: No data received").setMimeType(ContentService.MimeType.TEXT);
    }

    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "DATABASE_PESERTA";
    var sheet = ss.getSheetByName(sheetName);
    
    // Auto-create sheet if missing
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["TIMESTAMP", "ID_BOOKING", "NAMA_LENGKAP", "WHATSAPP", "EMAIL", "GUNUNG", "TGL_MULAI", "TGL_SELESAI", "TRIP", "PAKET", "ALAMAT", "STATUS"]);
      sheet.getRange(1, 1, 1, 12).setBackground("#e11d48").setFontColor("white").setFontWeight("bold").setFrozenRows(1);
    }

    if (data.action === "TEST_CONNECTION") {
      try { 
        if (data.adminEmail) {
          GmailApp.sendEmail(data.adminEmail, "✅ CLOUD CONNECTED - Jejak Langkah", "Sistem Jejak Langkah Adventure Berhasil Terhubung pada " + (data.timestamp || new Date().toLocaleString()) + ". Database Anda siap digunakan."); 
        }
      } catch(f) {
        console.log("Test email failed: " + f.toString());
      }
      return ContentService.createTextOutput("success").setMimeType(ContentService.MimeType.TEXT);
    }

    if (data.action === "NEW_REGISTRATION") {
      var r = data.registration;
      var bookingId = "JL-" + (r.id ? r.id.toString().slice(-6).toUpperCase() : "TEMP");
      
      // Duplication check
      var lastRow = sheet.getLastRow();
      var exists = false;
      if (lastRow > 1) {
        var range = sheet.getRange(2, 2, lastRow - 1, 1);
        var values = range.getValues();
        for (var i = 0; i < values.length; i++) {
          if (values[i][0] == bookingId) { exists = true; break; }
        }
      }

      if (!exists) {
        // Safe mapping to prevent row errors
        var rowData = [
          r.timestamp || new Date().toLocaleString(),
          bookingId,
          r.fullName || "N/A",
          "'" + (r.whatsapp || ""),
          r.email || "",
          r.mountain || "",
          r.startDate || "",
          r.endDate || "",
          r.tripType || "",
          r.packageCategory || "",
          r.address || "",
          r.status || "Menunggu Verifikasi"
        ];
        
        sheet.appendRow(rowData);
        
        // Notifications
        var prefs = data.notificationPrefs || {};
        try {
          if (prefs.notifyUserOnNew && r.email) {
            var subjectUser = "Konfirmasi Pendaftaran Ekspedisi [" + bookingId + "]";
            var bodyUser = "Halo " + r.fullName + ",\\n\\nPendaftaran Anda untuk pendakian " + r.mountain + " telah kami terima dengan ID " + bookingId + ".\\n\\nMohon tunggu proses verifikasi admin.\\n\\nSalam Petualang,\\nJejak Langkah Adventure";
            GmailApp.sendEmail(r.email, subjectUser, bodyUser);
          }
          
          if (prefs.notifyAdminOnNew && data.adminEmail) {
            var subjectAdmin = "🚨 PENDAFTARAN BARU: " + r.fullName;
            var bodyAdmin = "Ada pendaftaran baru masuk:\\nNama: " + r.fullName + "\\nTujuan: " + r.mountain + "\\nID Booking: " + bookingId + "\\nWhatsApp: " + r.whatsapp + "\\n\\nCek Dashboard Admin untuk verifikasi.";
            GmailApp.sendEmail(data.adminEmail, subjectAdmin, bodyAdmin);
          }
        } catch(mailErr) {
          console.log("Notification error: " + mailErr.toString());
        }
      }

      return ContentService.createTextOutput("success").setMimeType(ContentService.MimeType.TEXT);
    }
    
    return ContentService.createTextOutput("Error: Action not recognized").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    console.log("General error: " + err.toString());
    return ContentService.createTextOutput("Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}`;
  };

  const stats = useMemo(() => {
    return { total: data.length, unsynced: data.filter(r => !r.isSynced).length };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = !search || item.fullName.toLowerCase().includes(search.toLowerCase()) || item.whatsapp.includes(search);
      let matchDate = true;
      if (dateStart && item.startDate < dateStart) matchDate = false;
      if (dateEnd && item.startDate > dateEnd) matchDate = false;
      return matchSearch && matchDate;
    });
  }, [data, search, dateStart, dateEnd]);

  const updateNotifyAdmin = (v: boolean) => setSettings(p => ({ ...p, notificationPrefs: { ...p.notificationPrefs, notifyAdminOnNew: v } }));
  const updateNotifyUser = (v: boolean) => setSettings(p => ({ ...p, notificationPrefs: { ...p.notificationPrefs, notifyUserOnNew: v } }));
  const updateStatusTrigger = (status: string, v: boolean) => setSettings(p => ({
    ...p,
    notificationPrefs: {
      ...p.notificationPrefs,
      statusTriggers: {
        ...p.notificationPrefs.statusTriggers,
        [status]: v
      }
    }
  }));

  const renderStatusSelector = (reg: Registration) => (
    <select 
      value={reg.status} 
      onChange={(e) => onUpdateStatus?.(reg.id, e.target.value)}
      className="text-[10px] font-black uppercase bg-stone-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-accent cursor-pointer dark:text-white transition-all hover:bg-stone-200 dark:hover:bg-slate-700 w-full lg:w-auto"
    >
      <option value="Menunggu Verifikasi">Pending</option>
      <option value="Terverifikasi">Approve</option>
      <option value="Diproses">Process</option>
      <option value="Dibatalkan">Reject</option>
    </select>
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <TooltipWrapper text="Panel Kendali Utama">
              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              </div>
            </TooltipWrapper>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-stone-800 dark:text-white leading-tight">Control Center</h2>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest mt-1">Status Cloud: <span className={!!settings.googleScriptUrl ? 'text-green-600' : 'text-red-500'}>{!!settings.googleScriptUrl ? 'Tersambung' : 'Terputus'}</span></p>
            </div>
          </div>
          <TooltipWrapper text="Keluar dari Sesi Admin">
            <button onClick={onLogout} className="px-6 py-3 bg-stone-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-stone-500 dark:text-stone-300 hover:text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Keluar</button>
          </TooltipWrapper>
        </div>

        <div className="flex flex-wrap gap-4 items-center px-1">
          {stats.total > 0 && (
            <TooltipWrapper text="Ekspor Semua Data ke CSV">
              <button 
                onClick={handleExportCSV}
                className="px-6 md:px-8 py-3 md:py-4 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Unduh Semua Data
              </button>
            </TooltipWrapper>
          )}
          
          {stats.unsynced > 0 && (
            <div className="flex flex-col items-start gap-1.5 w-full sm:w-auto">
               <button 
                onClick={handleSyncAll} 
                disabled={isSyncingAll || !settings.googleScriptUrl}
                className="px-6 md:px-8 py-3 md:py-4 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 flex items-center gap-3 border border-white/10 w-full justify-center"
              >
                {isSyncingAll ? (
                  <div className="w-4 h-4 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                )}
                {isSyncingAll ? 'Sinkronisasi...' : `Sinkron ${stats.unsynced} Data`}
              </button>
              {isSyncingAll && (
                <div className="w-full h-1.5 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 shadow-inner">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-stone-200 dark:border-stone-800 gap-10 overflow-x-auto no-scrollbar px-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'table', label: 'Daftar Peserta' },
          { id: 'settings', label: 'Konfigurasi' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-5 text-[11px] font-black uppercase tracking-[0.3em] border-b-2 transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'}`}>{tab.label}</button>
        ))}
      </div>

      {activeSubTab === 'table' && (
        <div className="flex flex-col gap-6">
           <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden transition-colors">
             <div className="p-6 md:p-8 flex flex-col gap-6 bg-stone-50/50 dark:bg-slate-900/20">
               <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-12 gap-5">
                 <div className="lg:col-span-5 relative">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Cari Nama / WhatsApp</span>
                    <input type="text" placeholder="Ketik nama atau nomor..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-6 py-4 bg-white dark:bg-slate-800/60 border border-stone-100 dark:border-stone-800 rounded-2xl text-xs font-bold outline-none transition-all dark:text-white focus:ring-2 focus:ring-accent/20" />
                 </div>
                 <div className="lg:col-span-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Dari Tanggal</span>
                    <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full px-6 py-4 bg-white dark:bg-slate-800/60 border border-stone-100 dark:border-stone-800 rounded-2xl text-xs font-bold outline-none transition-all dark:text-white focus:ring-2 focus:ring-accent/20" />
                 </div>
                 <div className="lg:col-span-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Sampai Tanggal</span>
                    <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full px-6 py-4 bg-white dark:bg-slate-800/60 border border-stone-100 dark:border-stone-800 rounded-2xl text-xs font-bold outline-none transition-all dark:text-white focus:ring-2 focus:ring-accent/20" />
                 </div>
                 <div className="lg:col-span-1 flex items-end">
                    <button onClick={() => { setDateStart(''); setDateEnd(''); setSearch(''); }} className="w-full h-[52px] flex items-center justify-center bg-stone-100 dark:bg-slate-800 rounded-2xl hover:bg-stone-200 dark:hover:bg-slate-700 transition-all group">
                      <svg className="w-5 h-5 text-stone-500 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
               </div>
             </div>
           </div>

           {/* Mobile List View */}
           <div className="grid grid-cols-1 gap-4 lg:hidden">
              {filteredData.length === 0 ? (
                <div className="py-20 text-center bg-slate-900/20 rounded-[2.5rem] border border-stone-800">
                  <span className="text-xs font-black uppercase tracking-widest text-stone-600">Data Kosong</span>
                </div>
              ) : filteredData.map(reg => (
                <div key={reg.id} className={`p-6 bg-white dark:bg-slate-900/40 border rounded-[2rem] space-y-5 shadow-sm relative transition-all ${reg.isSynced ? 'border-stone-100 dark:border-stone-800' : 'border-amber-500/30 bg-amber-500/[0.02]'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">#{reg.id.toString().slice(-6)}</span>
                      <span className="text-xs font-black text-stone-800 dark:text-white uppercase mt-1">{reg.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {reg.isSynced ? (
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                      ) : (
                        <button 
                          onClick={() => handleManualSync(reg.id)}
                          disabled={syncingId === reg.id || !settings.googleScriptUrl}
                          className="w-8 h-8 bg-accent text-white rounded-lg flex items-center justify-center"
                        >
                          {syncingId === reg.id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-50 dark:border-stone-800/50">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Gunung</span>
                      <span className="text-[10px] font-black text-accent uppercase">{reg.mountain}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Mulai</span>
                      <span className="text-[10px] font-bold text-stone-500 uppercase">{reg.startDate}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {renderStatusSelector(reg)}
                  </div>
                </div>
              ))}
           </div>
           
           {/* Desktop Table View */}
           <div className="hidden lg:block bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden transition-colors">
             <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-stone-50/50 dark:bg-slate-950/40 border-b border-stone-100 dark:border-stone-800">
                      <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">ID & Cloud</th>
                      <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">Peserta</th>
                      <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">Tujuan & Detail</th>
                      <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                   {filteredData.length === 0 ? (
                     <tr><td colSpan={4} className="px-10 py-24 text-center text-[12px] font-black uppercase tracking-[0.4em] text-stone-300 dark:text-stone-600/40">Data tidak ditemukan</td></tr>
                   ) : filteredData.map(reg => (
                     <tr key={reg.id} className={`hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors relative border-l-4 ${reg.isSynced ? 'border-l-transparent' : 'border-l-amber-500 bg-amber-500/[0.02]'}`}>
                       <td className="px-10 py-7">
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-tighter">#{reg.id.toString().slice(-6)}</span>
                              <span className="text-[10px] font-bold text-stone-300 dark:text-stone-600 mt-1">{reg.timestamp}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {reg.isSynced ? (
                                 <TooltipWrapper text="Cloud Verified">
                                   <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl border border-green-500/20">
                                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                     <span className="text-[9px] font-black uppercase tracking-widest">SYNCED</span>
                                   </div>
                                 </TooltipWrapper>
                              ) : (
                                 <div className="flex items-center gap-3">
                                   <TooltipWrapper text="Local Record">
                                     <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-xl border border-amber-500/20">
                                        <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce"></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">LOCAL</span>
                                     </div>
                                   </TooltipWrapper>
                                   <button 
                                     disabled={syncingId === reg.id || !settings.googleScriptUrl}
                                     onClick={() => handleManualSync(reg.id)}
                                     className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg shadow-accent/20"
                                   >
                                     {syncingId === reg.id ? (
                                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                     ) : (
                                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                     )}
                                   </button>
                                 </div>
                              )}
                            </div>
                          </div>
                       </td>
                       <td className="px-10 py-7">
                          <div className="flex flex-col">
                            <span className="text-sm font-black uppercase text-stone-800 dark:text-white tracking-tight leading-none">{reg.fullName}</span>
                            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mt-2 tracking-widest">{reg.whatsapp}</span>
                          </div>
                       </td>
                       <td className="px-10 py-7">
                          <div className="flex flex-col">
                            <span className="text-sm font-black uppercase text-accent tracking-tight leading-none">{reg.mountain}</span>
                            <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase mt-2 tracking-[0.2em]">{reg.startDate} • {reg.tripType}</span>
                          </div>
                       </td>
                       <td className="px-10 py-7">
                          {renderStatusSelector(reg)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="max-w-4xl space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-10 px-2">
          <section className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden transition-colors">
            <div className="p-8 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-slate-900/30 flex items-center gap-5">
              <div className="p-3 bg-stone-100 dark:bg-slate-800 rounded-2xl">
                <svg className="w-6 h-6 text-stone-600 dark:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div>
                <h4 className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.3em]">Integrasi Cloud</h4>
                <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">Google Sheets Webhook Configuration</p>
              </div>
            </div>
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Input label="Webhook URL (/exec)" value={settings.googleScriptUrl} onChange={(e) => setSettings(p => ({ ...p, googleScriptUrl: e.target.value }))} placeholder="https://script.google.com/macros/s/.../exec" />
                <Input label="Email Admin Notifikasi" type="email" value={settings.adminEmail} onChange={(e) => setSettings(p => ({ ...p, adminEmail: e.target.value }))} />
              </div>
              <div className="flex flex-wrap gap-5 pt-4">
                <button onClick={handleTestConnection} disabled={testStatus === 'sending'} className={`px-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-4 transition-all shadow-xl ${testStatus === 'success' ? 'bg-green-600 text-white shadow-green-900/20' : testStatus === 'error' ? 'bg-red-600 text-white shadow-red-900/20' : 'bg-stone-900 dark:bg-slate-800 text-white hover:bg-black dark:hover:bg-slate-700 hover:scale-105 active:scale-95'}`}>{testStatus === 'sending' ? 'Connecting...' : testStatus === 'success' ? 'Connection OK' : testStatus === 'error' ? 'Connection Failed' : 'Test Cloud Connection'}</button>
                <button onClick={() => setShowScriptModal(true)} className="px-8 py-5 bg-accent text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/20">Dapatkan Apps Script Code</button>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden transition-colors">
            <div className="p-8 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-slate-900/30 flex items-center gap-5">
              <div className="p-3 bg-stone-100 dark:bg-slate-800 rounded-2xl">
                <svg className="w-6 h-6 text-stone-600 dark:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <div>
                <h4 className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-[0.3em]">Otomasi Notifikasi</h4>
                <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">Sistem Pengiriman Email Otomatis</p>
              </div>
            </div>
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Toggle label="Notifikasi Admin (New)" checked={settings.notificationPrefs.notifyAdminOnNew} onChange={updateNotifyAdmin} />
                <Toggle label="Konfirmasi Peserta (New)" checked={settings.notificationPrefs.notifyUserOnNew} onChange={updateNotifyUser} />
              </div>
              
              <div className="pt-6">
                <h5 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.4em] mb-6 px-2 flex items-center gap-3">
                  <div className="w-8 h-[1px] bg-stone-200 dark:bg-stone-800"></div>
                  Notification Triggers
                  <div className="w-8 h-[1px] bg-stone-200 dark:bg-stone-800"></div>
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Toggle label="Status: Approved" checked={settings.notificationPrefs.statusTriggers["Terverifikasi"]} onChange={(v) => updateStatusTrigger("Terverifikasi", v)} />
                  <Toggle label="Status: In Progress" checked={settings.notificationPrefs.statusTriggers["Diproses"]} onChange={(v) => updateStatusTrigger("Diproses", v)} />
                  <Toggle label="Status: Rejected" checked={settings.notificationPrefs.statusTriggers["Dibatalkan"]} onChange={(v) => updateStatusTrigger("Dibatalkan", v)} />
                </div>
              </div>
            </div>
          </section>

          {isDirty && (
            <div className="flex gap-5 pt-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <button 
                onClick={() => handleSaveSettings()} 
                className="flex-1 py-6 bg-accent text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl shadow-accent/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                {saveStatus === 'saving' ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                )}
                {saveStatus === 'saving' ? 'Processing...' : 'Simpan Seluruh Konfigurasi'}
              </button>
            </div>
          )}
        </div>
      )}

      {showScriptModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-midnight/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[3.5rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)] border border-stone-200 dark:border-stone-800 flex flex-col max-h-[90vh] transition-all">
            <div className="p-12 border-b border-stone-100 dark:border-stone-800 flex justify-between items-start bg-stone-50/30 dark:bg-slate-950/30">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-stone-800 dark:text-white leading-none">Apps Script Backend V17.5</h3>
                <p className="text-[11px] font-black text-accent uppercase mt-3 tracking-[0.3em]">Professional Cloud Connector System</p>
              </div>
              <button onClick={() => setShowScriptModal(false)} className="w-14 h-14 flex items-center justify-center bg-stone-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-lg active:scale-90">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">Implementation Steps</h4>
                  <button onClick={() => { navigator.clipboard.writeText(generateAppsScriptCode()); alert("Code Copied to Clipboard!"); }} className="px-6 py-3 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20">Copy System Code</button>
                </div>
                <div className="text-[12px] text-stone-500 dark:text-stone-300 font-medium space-y-4 leading-relaxed bg-amber-500/[0.03] p-8 rounded-[2rem] border border-amber-500/10 shadow-inner">
                  <p className="font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-3">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Critical Setup Instructions
                  </p>
                  <ol className="list-decimal list-inside space-y-3 pl-2 marker:font-black marker:text-accent">
                    <li>Open your <strong>Google Spreadsheet</strong> target database.</li>
                    <li>Go to <strong>Extensions</strong> &gt; <strong>Apps Script</strong> in the top menu.</li>
                    <li>Clear the existing `myFunction` and paste the <strong>System Code</strong> provided below.</li>
                    <li>Click <strong>Deploy</strong> &gt; <strong>New Deployment</strong> (Blue button).</li>
                    <li>Select type: <strong>Web App</strong>. Set "Execute as" to <strong>Me</strong> and "Who has access" to <strong>Anyone</strong>.</li>
                    <li>Authorize Google Access (Click Advanced &gt; Go to Project Name if prompted).</li>
                    <li>Copy the <strong>Web App URL</strong> and save it in the <strong>Webhook URL</strong> setting in this dashboard.</li>
                  </ol>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent to-red-900 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition-all"></div>
                  <pre className="relative p-10 bg-slate-950 text-green-400 rounded-[2.5rem] text-[11px] font-mono overflow-x-auto leading-relaxed h-[450px] border border-stone-800 custom-scrollbar shadow-2xl">
                    {generateAppsScriptCode()}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-12 border-t border-stone-100 dark:border-stone-800 bg-stone-50/30 dark:bg-slate-950/30">
              <button onClick={() => setShowScriptModal(false)} className="w-full py-6 bg-stone-900 dark:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.5em] rounded-[2rem] shadow-2xl hover:bg-black dark:hover:bg-slate-700 active:scale-95 transition-all">
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
