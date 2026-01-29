
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
  mountains: ["Gunung Semeru", "Gunung Rinjani", "Gunung Prau", "Gunung Seminung", "Gunung Pesagi", "Gunung Kerinci", "Gunung Merbabu", "Gunung Gede", "Gunung Lawu"],
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
  // Inisialisasi tema dari localStorage
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

  // Efek untuk mengaplikasikan tema dan menyimpan ke localStorage
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

      if (keepHistory) {
        const updatedRegs = [...registrations, newReg];
        setRegistrations(updatedRegs);
        localStorage.setItem(DB_KEY, JSON.stringify(updatedRegs));
      } else {
        localStorage.removeItem(DB_KEY);
        setRegistrations([newReg]);
      }

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
      {/* HEADER SECTION */}
      <header className={`${isDarkMode ? 'bg-midnight/80 border-stone-800' : 'bg-white/80 border-stone-200'} backdrop-blur-xl sticky top-0 z-50 border-b no-print`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
              <svg viewBox="0 0 500 500" className="w-6 h-6 fill-white"><path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" /></svg>
            </div>
            <div>
              <h1 className={`text-sm font-black uppercase tracking-widest leading-tight ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>Jejak Langkah</h1>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">Adventure Expedition</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 p-1.5 rounded-2xl border shadow-2xl ${isDarkMode ? 'bg-slate-850 border-stone-800/50' : 'bg-stone-100 border-stone-200'}`}>
            <button 
              onClick={() => setActiveTab('edit')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-stone-400 hover:text-stone-600 dark:hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Formulir
            </button>
            <button 
              onClick={() => setActiveTab('preview')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-stone-400 hover:text-stone-600 dark:hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" /></svg>
              Tiket Saya
            </button>
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-stone-400 hover:text-stone-600 dark:hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Admin
            </button>
          </div>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-10 flex items-center justify-center rounded-full border shadow-xl transition-all ${isDarkMode ? 'bg-slate-850 border-stone-800 text-yellow-400 hover:bg-slate-800' : 'bg-stone-100 border-stone-200 text-slate-700 hover:bg-stone-200'}`}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {activeTab === 'edit' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* HERO SECTION */}
            <div className="mb-16">
              <h2 className={`text-7xl font-black leading-[0.9] tracking-tighter ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
                Mulai <span className="text-accent">Pendakian</span> Anda
              </h2>
              <p className="mt-6 text-stone-500 text-lg font-medium max-w-2xl">
                Isi data pendaftaran dengan teliti untuk keamanan pendakian Anda. Pastikan dokumen identitas masih berlaku.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* SECTION 1: PERSONAL */}
              <div className={`lg:col-span-7 p-10 rounded-[3rem] border shadow-2xl relative overflow-hidden group ${isDarkMode ? 'bg-slate-850 border-stone-800' : 'bg-white border-stone-200'}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-accent/10 transition-all duration-700"></div>
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-accent/20">1</div>
                  <h3 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>Informasi Personal</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input label="Nama Lengkap" name="fullName" value={data.fullName} onChange={handleInputChange} placeholder="Sesuai KTP" error={errors.fullName} />
                  <Input label="Nomor WhatsApp" name="whatsapp" value={data.whatsapp} onChange={handleInputChange} placeholder="Contoh: 0812..." error={errors.whatsapp} />
                  <Input label="Email" name="email" type="email" value={data.email} onChange={handleInputChange} placeholder="email@anda.com" error={errors.email} />
                  <Input label="Kode Pendaki (Merbabu)" name="climberCode" value={data.climberCode} onChange={handleInputChange} placeholder="Opsional" />
                </div>
                
                <div className={`mt-8 pt-8 border-t ${isDarkMode ? 'border-stone-800/50' : 'border-stone-100'}`}>
                  <Input label="Alamat Domisili" isTextArea name="address" value={data.address} onChange={handleInputChange} placeholder="Alamat lengkap saat ini..." />
                </div>
              </div>

              {/* SECTION 2: DETAIL TRIP */}
              <div className="lg:col-span-5 flex flex-col gap-10">
                <div className={`p-10 rounded-[3rem] border shadow-2xl ${isDarkMode ? 'bg-slate-850 border-stone-800' : 'bg-white border-stone-200'}`}>
                  <div className="flex items-center gap-5 mb-10">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-accent/20">2</div>
                    <h3 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>Detail Trip</h3>
                  </div>

                  <div className="space-y-8">
                    <Select label="Tujuan Gunung" name="mountain" options={formConfig.mountains} value={data.mountain} onChange={handleInputChange} error={errors.mountain} />
                    
                    <div className="grid grid-cols-2 gap-6">
                      <Input label="Mulai" type="date" name="startDate" value={data.startDate} onChange={handleInputChange} error={errors.startDate} />
                      <Input label="Selesai" type="date" name="endDate" value={data.endDate} onChange={handleInputChange} />
                    </div>

                    <div className="pt-4">
                      <RadioGroup label="Tipe Trip" options={formConfig.tripTypes} value={data.tripType} onChange={(v) => setData(p => ({ ...p, tripType: v }))} />
                    </div>

                    <div className="pt-4">
                      <RadioGroup label="Pilih Paket Layanan" options={formConfig.packageCategories} value={data.packageCategory} onChange={(v) => setData(p => ({ ...p, packageCategory: v }))} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={keepHistory} 
                        onChange={(e) => setKeepHistory(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border-2 rounded-md transition-all ${keepHistory ? 'bg-red-600 border-red-600' : isDarkMode ? 'border-stone-700' : 'border-stone-300'}`}>
                        {keepHistory && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors">
                      Simpan Riwayat di Browser Ini
                    </span>
                  </label>

                  <button 
                    onClick={() => validate() && setIsModalOpen(true)}
                    className="w-full py-6 bg-accent hover:bg-rose-500 text-white font-black text-sm uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl shadow-accent/30 transition-all active:scale-95 group"
                  >
                    Daftar Sekarang
                    <span className="inline-block ml-3 group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="max-w-xl mx-auto animate-in fade-in duration-500">
            {registrations.length === 0 ? (
              <div className={`text-center py-20 rounded-[3rem] border ${isDarkMode ? 'bg-slate-850 border-stone-800' : 'bg-white border-stone-200'}`}>
                 <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Belum ada riwayat pendaftaran.</p>
                 <button onClick={() => setActiveTab('edit')} className="mt-6 px-8 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">Cari Ekspedisi</button>
              </div>
            ) : (
              <div className="space-y-10">
                {!keepHistory && (
                  <div className={`border p-4 rounded-2xl mb-8 ${isDarkMode ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-200'}`}>
                    <p className={`text-[9px] font-black uppercase text-center leading-relaxed ${isDarkMode ? 'text-amber-500' : 'text-amber-700'}`}>
                      ⚠️ Demi keamanan privasi, data lokal akan terhapus saat Anda meninggalkan halaman ini. 
                      Silakan unduh E-Ticket Anda sekarang.
                    </p>
                  </div>
                )}
                {registrations.slice().reverse().map(reg => (
                  <ETicketCard key={reg.id} registration={reg} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          isAdminAuthenticated ? (
            <AdminDashboard data={registrations} onLogout={() => setIsAdminAuthenticated(false)} isDarkMode={isDarkMode} />
          ) : (
            <div className={`max-w-sm mx-auto p-10 rounded-[3rem] border text-center shadow-2xl space-y-8 ${isDarkMode ? 'bg-slate-850 border-stone-800' : 'bg-white border-stone-200'}`}>
              <h2 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>Admin Access</h2>
              <input 
                type="password" 
                value={adminPassInput} 
                onChange={(e) => setAdminPassInput(e.target.value)}
                placeholder="Password" 
                className={`w-full px-5 py-4 border-2 rounded-2xl text-center outline-none focus:border-accent ${isDarkMode ? 'bg-midnight border-stone-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'}`}
              />
              <button onClick={() => adminPassInput === 'admin123' ? setIsAdminAuthenticated(true) : alert('Akses Ditolak!')} className="w-full py-4 bg-accent text-white font-black text-[10px] uppercase rounded-2xl">Masuk Panel</button>
            </div>
          )
        )}
      </main>

      <footer className="p-12 text-center text-[10px] font-bold text-stone-600 uppercase tracking-[0.5em] no-print">
        © 2024 JEJAK LANGKAH ADVENTURE • EXPEDITION SYSTEM V1.5
      </footer>

      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleSubmit} data={data} isSending={isSending} error={submitError} bankInfo={{bankName: 'BRI', accountNumber: '570401009559504', accountName: 'ILHAM FADHILAH'}} />
      <WelcomePopup isOpen={isWelcomeOpen} onClose={() => setIsWelcomeOpen(false)} />
    </div>
  );
};

export default App;
