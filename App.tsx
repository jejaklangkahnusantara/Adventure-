
import React, { useState, useEffect } from 'react';
import { PersonalData, Registration, AdminSettings, FormConfig, FormErrors } from './types';
import Input from './components/Input';
import Select from './components/Select';
import RadioGroup from './components/RadioGroup';
import AdminDashboard from './components/AdminDashboard';
import ConfirmationModal from './components/ConfirmationModal';
import ETicketCard from './components/ETicketCard';
import WelcomePopup from './components/WelcomePopup';

const DEFAULT_ADMIN_EMAIL = "jejaklangkah.nusantara.id@gmail.com";
const THEME_KEY = 'jejak_langkah_theme';
const DB_KEY = 'jejak_langkah_registrations';
const ADMIN_AUTH_KEY = 'jejak_langkah_admin_auth';
const SETTINGS_KEY = 'jejak_langkah_admin_settings';
const WELCOME_SHOWN_KEY = 'jejak_langkah_welcome_shown';

const defaultFormConfig: FormConfig = {
  mountains: [
    "Gunung Semeru", "Gunung Rinjani", "Gunung Prau", "Gunung Seminung", 
    "Gunung Pesagi", "Gunung Kerinci", "Gunung Merbabu", "Gunung Gede", 
    "Gunung Lawu", "Gunung Slamet", "Gunung Sumbing", "Gunung Sindoro", 
    "Gunung Dempo", "Gunung Tanggamus", "Gunung Pesawaran", "Gunung Ratai", 
    "Gunung Kembang"
  ],
  tripTypes: ["Private Trip", "Open Trip", "Share Cost"],
  packageCategories: ["REGULER", "Paket A", "Paket B"]
};

const initialData: PersonalData = {
  fullName: '',
  email: '',
  whatsapp: '',
  gender: '',
  climberCode: '',
  mountain: '',
  startDate: '',
  endDate: '',
  tripType: '',
  packageCategory: '',
  extraPorter: false,
  identityFile: null,
  address: '',
  status: 'Menunggu Verifikasi'
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const [data, setData] = useState<PersonalData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'admin'>('edit');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [formConfig, setFormConfig] = useState<FormConfig>(defaultFormConfig);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [keepHistory, setKeepHistory] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedRegs = localStorage.getItem(DB_KEY);
    if (savedRegs) setRegistrations(JSON.parse(savedRegs));
    
    const auth = sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (auth === 'true') setIsAdminAuthenticated(true);

    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const settings: AdminSettings = JSON.parse(savedSettings);
      if (settings.formConfig) setFormConfig(settings.formConfig);
    }

    const welcomeShown = localStorage.getItem(WELCOME_SHOWN_KEY);
    if (!welcomeShown) {
      setTimeout(() => setIsWelcomeOpen(true), 800);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!data.fullName) newErrors.fullName = "Wajib diisi";
    if (!data.whatsapp) newErrors.whatsapp = "Wajib diisi";
    if (!data.mountain) newErrors.mountain = "Pilih tujuan";
    if (!data.startDate) newErrors.startDate = "Wajib diisi";
    if (!data.tripType) newErrors.tripType = "Pilih tipe trip";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstError)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setIsSending(true);
    setSubmitError(null);
    try {
      const settingsStr = localStorage.getItem(SETTINGS_KEY);
      const settings: AdminSettings | null = settingsStr ? JSON.parse(settingsStr) : null;
      
      const newReg: Registration = {
        ...data,
        id: Date.now(),
        timestamp: new Date().toLocaleString('id-ID'),
        identityFile: data.identityBase64 || '',
        status: 'Menunggu Verifikasi'
      };

      if (settings?.googleScriptUrl) {
        await fetch(settings.googleScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'NEW_REGISTRATION', registration: newReg, adminEmail: settings.adminEmail || DEFAULT_ADMIN_EMAIL })
        });
      }

      const updatedRegs = keepHistory ? [...registrations, newReg] : [newReg];
      setRegistrations(updatedRegs);
      localStorage.setItem(DB_KEY, JSON.stringify(updatedRegs));

      setIsModalOpen(false);
      setData(initialData);
      setActiveTab('preview');
    } catch (err) {
      setSubmitError('Terjadi gangguan jaringan.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-inter selection:bg-accent selection:text-white transition-colors duration-500 ${isDarkMode ? 'bg-midnight text-stone-100' : 'bg-stone-50 text-stone-900'}`}>
      {/* Dynamic Floating Header */}
      <header className={`${isDarkMode ? 'bg-midnight/80 border-stone-800' : 'bg-white/80 border-stone-200'} backdrop-blur-xl sticky top-0 z-50 border-b no-print transition-all duration-500`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
              <svg viewBox="0 0 500 500" className="w-5 h-5 fill-white"><path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" /></svg>
            </div>
            <div className="hidden xs:block">
              <h1 className={`text-xs md:text-sm font-black uppercase tracking-[0.2em] leading-tight ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>Jejak Langkah</h1>
              <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest opacity-60">Adventure Expedition</p>
            </div>
          </div>
          
          <nav className={`flex items-center gap-1 p-1 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-stone-800/50' : 'bg-stone-100 border-stone-200 shadow-sm'}`}>
            {[
              { id: 'edit', label: 'Form' },
              { id: 'preview', label: 'Tiket' },
              { id: 'admin', label: 'Admin', tooltip: 'Kelola pendaftaran ekspedisi' }
            ].map(tab => (
              <div key={tab.id} className="relative group">
                <button 
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-stone-500 hover:text-stone-400'}`}
                >
                  {tab.label}
                </button>
                {tab.tooltip && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-40 p-3 bg-stone-900 text-white text-[8px] font-black uppercase tracking-widest rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-2xl z-50 text-center pointer-events-none">
                    {tab.tooltip}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-10 flex items-center justify-center rounded-2xl border transition-all active:scale-90 ${isDarkMode ? 'bg-slate-800 border-stone-700 text-yellow-400' : 'bg-white border-stone-200 text-stone-600 shadow-sm'}`}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16 w-full overflow-x-hidden">
        {activeTab === 'edit' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Mobile-Friendly Hero */}
            <div className="mb-10 md:mb-20 text-center md:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-[9px] font-black uppercase tracking-[0.3em] mb-4">Pendaftaran Terbuka</span>
              <h2 className={`text-4xl md:text-7xl font-black leading-[0.9] tracking-tighter ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
                MULAI <span className="text-accent">PENDAKIAN</span> ANDA.
              </h2>
              <p className="mt-6 text-stone-500 text-sm md:text-lg font-medium max-w-2xl mx-auto md:mx-0 leading-relaxed">
                Bergabunglah dalam ekspedisi profesional Jejak Langkah Adventure. Keamanan Anda adalah prioritas utama kami.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
              {/* Personal Data Card */}
              <div className={`lg:col-span-7 p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border shadow-2xl relative overflow-hidden group transition-all duration-500 ${isDarkMode ? 'bg-slate-900/40 border-stone-800' : 'bg-white border-stone-100 shadow-stone-200/50'}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="flex items-center gap-5 mb-12">
                  <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent font-black text-sm border border-accent/20">01</div>
                  <div>
                    <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>Data Personal</h3>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-1">Identitas resmi pendaftar</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input label="Nama Lengkap" name="fullName" value={data.fullName} onChange={handleInputChange} error={errors.fullName} placeholder="Sesuai KTP" />
                  <Input label="WhatsApp" name="whatsapp" value={data.whatsapp} onChange={handleInputChange} error={errors.whatsapp} placeholder="08xxxxxxxxxx" />
                  <Input label="Email Aktif" name="email" type="email" value={data.email} onChange={handleInputChange} error={errors.email} placeholder="email@domain.com" />
                  <Input label="Kode Pendaki" name="climberCode" value={data.climberCode} onChange={handleInputChange} placeholder="E-Simaksi (Opsional)" />
                </div>
                
                <div className={`mt-10 pt-10 border-t ${isDarkMode ? 'border-stone-800/50' : 'border-stone-100'}`}>
                  <Input label="Alamat Domisili" isTextArea name="address" value={data.address} onChange={handleInputChange} placeholder="Alamat lengkap saat ini..." />
                </div>
              </div>

              {/* Trip Configuration Card */}
              <div className="lg:col-span-5 flex flex-col gap-8 md:gap-12">
                <div className={`p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] border shadow-2xl transition-all duration-500 ${isDarkMode ? 'bg-slate-900/40 border-stone-800' : 'bg-white border-stone-100 shadow-stone-200/50'}`}>
                  <div className="flex items-center gap-5 mb-12">
                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent font-black text-sm border border-accent/20">02</div>
                    <div>
                      <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>Rencana Trip</h3>
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-1">Detail destinasi ekspedisi</p>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <Select label="Gunung Tujuan" name="mountain" options={formConfig.mountains} value={data.mountain} onChange={handleInputChange} error={errors.mountain} />
                    
                    <div className="grid grid-cols-2 gap-6">
                      <Input label="Mulai" type="date" name="startDate" value={data.startDate} onChange={handleInputChange} error={errors.startDate} />
                      <Input label="Selesai" type="date" name="endDate" value={data.endDate} onChange={handleInputChange} />
                    </div>

                    <div className="space-y-8">
                      <RadioGroup label="Tipe Ekspedisi" options={formConfig.tripTypes} value={data.tripType} onChange={(v) => setData(p => ({ ...p, tripType: v }))} />
                      <RadioGroup label="Kategori Paket" options={formConfig.packageCategories} value={data.packageCategory} onChange={(v) => setData(p => ({ ...p, packageCategory: v }))} />
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="space-y-6">
                  <label className="flex items-center gap-4 cursor-pointer group select-none px-2">
                    <input type="checkbox" checked={keepHistory} onChange={(e) => setKeepHistory(e.target.checked)} className="sr-only" />
                    <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${keepHistory ? 'bg-accent border-accent scale-110' : isDarkMode ? 'border-stone-700' : 'border-stone-300'}`}>
                      {keepHistory && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Simpan Riwayat di Perangkat</span>
                  </label>

                  <button 
                    onClick={() => validate() && setIsModalOpen(true)}
                    className="w-full py-6 md:py-8 bg-accent hover:bg-rose-500 text-white font-black text-sm md:text-base uppercase tracking-[0.4em] rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_-10px_rgba(225,29,72,0.4)] transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                    Daftar Ekspedisi
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            {registrations.length === 0 ? (
              <div className={`text-center py-24 rounded-[3rem] border border-dashed ${isDarkMode ? 'bg-slate-900/20 border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                 <div className="w-20 h-20 bg-stone-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-300">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tight mb-2">Belum ada Tiket</h3>
                 <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mb-10">Silakan isi formulir pendaftaran untuk memulai.</p>
                 <button onClick={() => setActiveTab('edit')} className="px-12 py-4 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20">Mulai Daftar</button>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Riwayat <span className="text-accent">Ekspedisi</span></h2>
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{registrations.length} Tiket</span>
                </div>
                {registrations.slice().reverse().map(reg => (
                  <ETicketCard key={reg.id} registration={reg} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="animate-in fade-in duration-700">
            {!isAdminAuthenticated ? (
              <div className={`max-w-md mx-auto p-12 rounded-[3.5rem] border text-center shadow-2xl space-y-10 transition-all duration-500 ${isDarkMode ? 'bg-slate-900/60 border-stone-800' : 'bg-white border-stone-100'}`}>
                <div className="w-20 h-20 bg-accent/10 rounded-[2rem] flex items-center justify-center mx-auto text-accent">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-2">Admin Portal</h2>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-relaxed">Masukkan kode otorisasi sistem untuk mengakses data peserta.</p>
                </div>
                <input 
                  type="password" 
                  value={adminPassInput} 
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  placeholder="••••••••" 
                  className={`w-full px-6 py-5 border-2 rounded-[1.8rem] text-center text-2xl tracking-[0.5em] outline-none transition-all duration-300 ${isDarkMode ? 'bg-midnight border-stone-800 text-white focus:border-accent' : 'bg-stone-50 border-stone-200 focus:border-accent'}`}
                />
                <button 
                  onClick={() => adminPassInput === 'admin123' ? setIsAdminAuthenticated(true) : alert('Akses Ditolak!')} 
                  className="w-full py-5 bg-stone-900 dark:bg-accent text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-[1.8rem] shadow-xl active:scale-95 transition-all"
                >
                  Buka Panel
                </button>
              </div>
            ) : (
              <AdminDashboard 
                data={registrations} 
                onLogout={() => { setIsAdminAuthenticated(false); sessionStorage.removeItem(ADMIN_AUTH_KEY); }} 
                isDarkMode={isDarkMode} 
                onUpdateStatus={(id, status) => {
                  const updated = registrations.map(r => r.id === id ? { ...r, status } : r);
                  setRegistrations(updated);
                  localStorage.setItem(DB_KEY, JSON.stringify(updated));
                }}
                onClearAll={() => { if(confirm('Hapus semua data?')) { setRegistrations([]); localStorage.removeItem(DB_KEY); }}}
              />
            )}
          </div>
        )}
      </main>

      {/* Simplified Mobile-Optimized Footer */}
      <footer className="p-12 text-center no-print border-t border-stone-200/10">
        <div className="flex flex-col gap-6 items-center">
          <div className="flex gap-6 items-center opacity-30">
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Professional Expedition</span>
            <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Cloud System</span>
          </div>
          <p className="text-[9px] font-bold text-stone-600 uppercase tracking-[0.5em] opacity-40">
            © 2024 JEJAK LANGKAH ADVENTURE • SYSTEM V1.5
          </p>
        </div>
      </footer>

      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleSubmit} data={data} isSending={isSending} error={submitError} bankInfo={{bankName: 'BRI', accountNumber: '570401009559504', accountName: 'ILHAM FADHILAH'}} />
      <WelcomePopup isOpen={isWelcomeOpen} onClose={() => setIsWelcomeOpen(false)} />
    </div>
  );
};

export default App;
