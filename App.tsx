
import React, { useState, useEffect } from 'react';
import { PersonalData, Registration, AdminSettings, FormConfig, FormErrors } from './types';
import Input from './components/Input';
import Select from './components/Select';
import RadioGroup from './components/RadioGroup';
import AdminDashboard from './components/AdminDashboard';
import ConfirmationModal from './components/ConfirmationModal';
import ETicketCard from './components/ETicketCard';
import WelcomePopup from './components/WelcomePopup';
import { getMountainAdvice } from './services/geminiService';

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved ? saved === 'dark' : true;
  });

  const [data, setData] = useState<PersonalData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'admin'>('edit');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [advice, setAdvice] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [formConfig, setFormConfig] = useState<FormConfig>(defaultFormConfig);
  const [adminPassInput, setAdminPassInput] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
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

  const closeWelcome = () => {
    setIsWelcomeOpen(false);
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!data.fullName) newErrors.fullName = "Wajib diisi";
    if (!data.email) newErrors.email = "Wajib diisi";
    if (!data.whatsapp) newErrors.whatsapp = "Wajib diisi";
    if (!data.mountain) newErrors.mountain = "Pilih tujuan";
    if (!data.startDate) newErrors.startDate = "Wajib diisi";
    if (!data.address) newErrors.address = "Wajib diisi";
    if (!data.climberCode) newErrors.climberCode = "Wajib diisi";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(newErrors).length === 0;
  };

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

  const handleAdviceRequest = async () => {
    if (!data.mountain) return alert('Pilih gunung terlebih dahulu');
    setAdvice('Menganalisis...');
    const result = await getMountainAdvice(data.mountain, data.startDate);
    setAdvice(result);
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const updated = registrations.map(r => r.id === id ? { ...r, status } : r);
    setRegistrations(updated);
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
  };

  const handleClearAllRegistrations = () => {
    if (window.confirm("Hapus semua data pendaftaran dari penyimpanan lokal?")) {
      setRegistrations([]);
      localStorage.removeItem(DB_KEY);
    }
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

      // 1. Kirim ke Google Script jika URL dikonfigurasi
      if (settings?.googleScriptUrl) {
        await fetch(settings.googleScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'NEW_REGISTRATION',
            registration: newReg,
            adminEmail: settings.adminEmail || DEFAULT_ADMIN_EMAIL,
            notificationPrefs: settings.notificationPrefs
          })
        });
      }

      // 2. LOGIKA PEMBERSIHAN OTOMATIS: 
      // Hapus data pendaftaran dari localStorage agar tidak menumpuk di perangkat.
      // Kita tetap menyisakan pendaftaran saat ini di state 'registrations' 
      // agar user bisa melihat tiketnya di tab Preview sebelum refresh/keluar.
      localStorage.removeItem(DB_KEY);
      
      // Kosongkan riwayat lama di UI, hanya sisakan tiket yang baru dibuat
      setRegistrations([newReg]);

      setIsModalOpen(false);
      setData(initialData);
      setAdvice('');
      setActiveTab('preview');
      
      // Notifikasi opsional bahwa data telah diamankan
      console.log("Pendaftaran Berhasil & Data Lokal Dibersihkan untuk Keamanan.");

    } catch (err) {
      setSubmitError('Terjadi gangguan jaringan.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col text-stone-900 dark:text-stone-100 transition-colors duration-500 font-inter">
      <header className="bg-white dark:bg-stone-900 sticky top-0 z-50 border-b border-stone-200 dark:border-stone-800 no-print">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-lg shadow-red-600/20">
              <svg viewBox="0 0 500 500" className="w-5 h-5 fill-white"><path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" /></svg>
            </div>
            <h1 className="text-sm font-black uppercase tracking-tighter">Jejak Langkah</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="flex gap-4">
              {['edit', 'preview', 'admin'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)} 
                  className={`text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'text-red-600' : 'text-stone-400'}`}
                >
                  {tab === 'edit' ? 'Formulir' : tab === 'preview' ? 'Tiket' : 'Admin'}
                </button>
              ))}
            </nav>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="text-stone-400 hover:text-red-600 transition-colors"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 py-12">
        {activeTab === 'edit' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">Pendaftaran Pendakian</h2>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Lengkapi data diri untuk izin masuk kawasan</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <Input label="Nama Lengkap" name="fullName" value={data.fullName} onChange={handleInputChange} placeholder="E.g. Jaka Sembung" error={errors.fullName} />
                <Input label="NIK / ID Card" name="climberCode" value={data.climberCode} onChange={handleInputChange} placeholder="E.g. 1234..." error={errors.climberCode} />
                <Input label="WhatsApp" name="whatsapp" value={data.whatsapp} onChange={handleInputChange} placeholder="0812..." error={errors.whatsapp} />
                <Input label="Email" name="email" type="email" value={data.email} onChange={handleInputChange} placeholder="name@domain.com" error={errors.email} />
              </div>

              <div className="space-y-6 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <Select label="Gunung Tujuan" name="mountain" options={formConfig.mountains} value={data.mountain} onChange={handleInputChange} error={errors.mountain} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Tgl Mulai" type="date" name="startDate" value={data.startDate} onChange={handleInputChange} error={errors.startDate} />
                  <Input label="Tgl Selesai" type="date" name="endDate" value={data.endDate} onChange={handleInputChange} />
                </div>
                <RadioGroup label="Jenis Trip" options={formConfig.tripTypes} value={data.tripType} onChange={(v) => setData(p => ({ ...p, tripType: v }))} columns={1} />
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
               <Input label="Alamat Domisili" isTextArea name="address" value={data.address} onChange={handleInputChange} placeholder="Alamat saat ini..." error={errors.address} />
               <div className="relative pt-6">
                  <div className="flex justify-between items-center mb-4">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Saran Keamanan AI</p>
                     <button onClick={handleAdviceRequest} className="text-[9px] font-black bg-stone-900 dark:bg-stone-800 text-white px-3 py-1.5 rounded uppercase">Dapatkan Saran AI</button>
                  </div>
                  {advice && <div className="p-4 bg-red-50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">{advice}</div>}
               </div>
            </div>

            <button 
              onClick={() => validate() && setIsModalOpen(true)} 
              className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                <path d="M12 2L2 22h20L12 2z" />
              </svg>
              Konfirmasi Pendaftaran
            </button>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="max-w-xl mx-auto animate-in fade-in duration-500">
            {registrations.length === 0 ? (
              <div className="text-center py-20">
                 <p className="opacity-50 text-xs font-bold uppercase tracking-widest">Belum ada riwayat pendaftaran.</p>
                 <button onClick={() => setActiveTab('edit')} className="mt-4 text-[10px] font-black text-red-600 underline uppercase tracking-widest">Kembali Ke Formulir</button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl mb-8">
                   <p className="text-[9px] font-black text-amber-700 dark:text-amber-500 uppercase text-center leading-relaxed">
                     ⚠️ Demi keamanan privasi, data lokal akan terhapus saat Anda meninggalkan halaman ini. 
                     Silakan unduh E-Ticket Anda sekarang.
                   </p>
                </div>
                {registrations.slice().reverse().map(reg => (
                  <ETicketCard key={reg.id} registration={reg} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          isAdminAuthenticated ? (
            <AdminDashboard 
              data={registrations} 
              onLogout={() => setIsAdminAuthenticated(false)} 
              isDarkMode={isDarkMode} 
              onSettingsUpdate={(s) => setFormConfig(s.formConfig)}
              onUpdateStatus={handleUpdateStatus}
              onClearAll={handleClearAllRegistrations}
            />
          ) : (
            <div className="max-w-xs mx-auto bg-white dark:bg-stone-900 p-8 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-6 text-center shadow-2xl">
              <h2 className="text-xs font-black uppercase tracking-widest">Admin Access</h2>
              <input 
                type="password" 
                value={adminPassInput} 
                onChange={(e) => setAdminPassInput(e.target.value)}
                placeholder="Password" 
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl text-center outline-none focus:ring-2 focus:ring-red-600"
              />
              <button onClick={() => adminPassInput === 'admin123' ? setIsAdminAuthenticated(true) : alert('Salah!')} className="w-full py-3 bg-red-600 text-white font-black text-[10px] uppercase rounded-xl">Login</button>
            </div>
          )
        )}
      </main>

      <footer className="p-10 text-center opacity-30 text-[9px] font-black uppercase tracking-[0.4em] no-print">
        &copy; 2024 Jejak Langkah Adventure
      </footer>

      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleSubmit} data={data} isSending={isSending} error={submitError} bankInfo={{bankName: 'BRI', accountNumber: '570401009559504', accountName: 'ILHAM FADHILAH'}} />
      <WelcomePopup isOpen={isWelcomeOpen} onClose={closeWelcome} />
    </div>
  );
};

export default App;
