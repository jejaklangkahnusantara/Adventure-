
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
  medicalNotes: '',
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
  const [adminLoginError, setAdminLoginError] = useState(false);

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

    // Tampilkan Welcome Popup jika belum pernah ditampilkan
    const welcomeShown = localStorage.getItem(WELCOME_SHOWN_KEY);
    if (!welcomeShown) {
      setTimeout(() => setIsWelcomeOpen(true), 1000);
    }
  }, []);

  const closeWelcome = () => {
    setIsWelcomeOpen(false);
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!data.fullName) newErrors.fullName = "Nama wajib diisi";
    if (!data.email) newErrors.email = "Email wajib diisi";
    if (!data.whatsapp) newErrors.whatsapp = "WhatsApp wajib diisi";
    if (!data.mountain) newErrors.mountain = "Pilih gunung tujuan";
    if (!data.startDate) newErrors.startDate = "Tentukan tanggal mulai";
    if (!data.address) newErrors.address = "Alamat domisili wajib diisi";
    if (!data.climberCode) newErrors.climberCode = "Kode pendaki/NIK wajib diisi";
    
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File terlalu besar (Maks 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setData(prev => ({ ...prev, identityFile: file, identityBase64: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdviceRequest = async () => {
    if (!data.mountain) return alert('Pilih gunung terlebih dahulu');
    setAdvice('Menganalisis keamanan...');
    const result = await getMountainAdvice(data.mountain, data.startDate, data.medicalNotes);
    setAdvice(result);
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const target = registrations.find(r => r.id === id);
    if (!target) return;

    // Update lokal
    const updated = registrations.map(r => r.id === id ? { ...r, status } : r);
    setRegistrations(updated);
    localStorage.setItem(DB_KEY, JSON.stringify(updated));

    // Sinkronisasi Cloud & Notifikasi
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const settings: AdminSettings = JSON.parse(savedSettings);
      if (settings.googleScriptUrl) {
        const shouldNotify = settings.notificationPrefs?.statusTriggers?.[status] || false;
        try {
          await fetch(settings.googleScriptUrl.trim(), {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              action: 'STATUS_UPDATE',
              registration: { ...target, status },
              newStatus: status,
              shouldNotify: shouldNotify
            })
          });
        } catch (e) {
          console.error("Gagal mengirim update status ke cloud:", e);
        }
      }
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

      const updatedRegs = [...registrations, newReg];
      setRegistrations(updatedRegs);
      localStorage.setItem(DB_KEY, JSON.stringify(updatedRegs));

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

      setIsModalOpen(false);
      setData(initialData);
      setAdvice('');
      setActiveTab('preview');
    } catch (err) {
      setSubmitError('Terjadi gangguan jaringan, data tersimpan lokal.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-blue-950 flex flex-col text-stone-900 dark:text-blue-50 transition-colors duration-500 font-inter">
      <header className="bg-white/80 dark:bg-blue-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 dark:border-blue-800 no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center rotate-6 shadow-lg shadow-red-600/20">
              <svg viewBox="0 0 500 500" className="w-6 h-6 fill-white"><path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" /></svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tighter leading-none">Jejak Langkah</h1>
              <p className="text-[8px] font-bold text-red-600 dark:text-red-400 uppercase tracking-[0.2em] mt-1">Adventure Expedition</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex bg-stone-100 dark:bg-blue-800/50 p-1 rounded-2xl">
              {[
                {id: 'edit', label: 'Formulir'},
                {id: 'preview', label: 'E-Ticket'},
                {id: 'admin', label: 'Admin'}
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white dark:bg-blue-700 text-red-600 dark:text-white shadow-sm' : 'text-stone-500 dark:text-blue-300 hover:text-stone-800 dark:hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-blue-800 text-stone-600 dark:text-blue-200 hover:scale-110 transition-transform"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10">
        {activeTab === 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Kolom Kiri: Form Input */}
            <div className="lg:col-span-8 space-y-10">
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter">Pendaftaran Ekspedisi</h2>
                <p className="text-stone-500 dark:text-blue-300/60 text-sm max-w-2xl">Lengkapi data diri dan rencana perjalanan Anda. Pastikan informasi kesehatan diisi dengan jujur demi keamanan pendakian.</p>
              </div>

              {/* Step 1: Identitas */}
              <section className="bg-white dark:bg-blue-900 p-8 rounded-[2rem] border border-stone-200 dark:border-blue-800 shadow-sm space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-blue-800 flex items-center justify-center text-xs font-black text-stone-400 dark:text-blue-400">01</span>
                  <h3 className="text-sm font-black uppercase tracking-widest dark:text-blue-100">Informasi Identitas</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Nama Lengkap" name="fullName" value={data.fullName} onChange={handleInputChange} placeholder="Sesuai KTP/Passport" error={errors.fullName} />
                  <Input label="NIK / Kode Pendaki" name="climberCode" value={data.climberCode} onChange={handleInputChange} placeholder="Nomor ID Unik" error={errors.climberCode} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="WhatsApp" name="whatsapp" value={data.whatsapp} onChange={handleInputChange} placeholder="Contoh: 0812..." error={errors.whatsapp} />
                  <Input label="Email" name="email" type="email" value={data.email} onChange={handleInputChange} placeholder="alamat@email.com" error={errors.email} />
                </div>
                <Input label="Alamat Domisili" isTextArea name="address" value={data.address} onChange={handleInputChange} placeholder="Alamat lengkap saat ini..." error={errors.address} />
              </section>
              
              {/* Step 2: Kesehatan */}
              <section className="bg-white dark:bg-blue-900 p-8 rounded-[2rem] border border-stone-200 dark:border-blue-800 shadow-sm space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-blue-800 flex items-center justify-center text-xs font-black text-stone-400 dark:text-blue-400">02</span>
                  <h3 className="text-sm font-black uppercase tracking-widest dark:text-blue-100">Kesehatan & Keamanan</h3>
                </div>
                <div className="relative">
                  <Input 
                    label="Catatan Medis" 
                    isTextArea 
                    name="medicalNotes" 
                    value={data.medicalNotes} 
                    onChange={handleInputChange} 
                    placeholder="Riwayat penyakit, cedera, atau alergi..." 
                    maxLength={150} 
                  />
                  <button 
                    type="button" 
                    onClick={handleAdviceRequest} 
                    className="absolute right-4 top-[2.4rem] text-[9px] font-black text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full uppercase transition-all shadow-lg shadow-red-600/20 active:scale-95 z-10"
                  >
                    💡 Analisis AI
                  </button>
                </div>
                {advice && (
                  <div className="p-6 bg-red-50 dark:bg-red-950/10 rounded-2xl border border-red-100 dark:border-red-900/30 text-xs leading-relaxed text-red-800 dark:text-red-200 animate-in slide-in-from-top-2">
                    <p className="font-black uppercase text-[10px] mb-2 tracking-widest opacity-60">Saran Safety Officer (AI):</p>
                    {advice}
                  </div>
                )}
              </section>
            </div>

            {/* Kolom Kanan: Trip Config */}
            <div className="lg:col-span-4 space-y-8">
              <section className="bg-stone-900 dark:bg-blue-900 text-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 sticky top-28 border border-white/5 dark:border-blue-800">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-white/10 dark:bg-blue-800 flex items-center justify-center text-xs font-black text-white/40 dark:text-blue-300">03</span>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/80">Konfigurasi Trip</h3>
                </div>

                <Select label="Tujuan" name="mountain" options={formConfig.mountains} value={data.mountain} onChange={handleInputChange} error={errors.mountain} />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Mulai" type="date" name="startDate" value={data.startDate} onChange={handleInputChange} error={errors.startDate} />
                  <Input label="Selesai" type="date" name="endDate" value={data.endDate} onChange={handleInputChange} />
                </div>

                <RadioGroup label="Jenis Trip" options={formConfig.tripTypes} value={data.tripType} onChange={(v) => setData(p => ({ ...p, tripType: v }))} columns={1} />
                
                <div className="pt-4 space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">Dokumen Identitas</label>
                  <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-white/20 dark:border-blue-700 hover:border-red-500 transition-all">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="p-6 text-center">
                      <p className="text-[10px] font-bold text-white/60 uppercase">{data.identityFile ? `✓ ${data.identityFile.name}` : 'Klik Unggah Foto KTP'}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => validate() && setIsModalOpen(true)} 
                  className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-red-600/20 transition-all hover:-translate-y-1 active:scale-95"
                >
                  Konfirmasi Pendaftaran
                </button>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="max-w-xl mx-auto py-10 animate-in fade-in zoom-in-95 duration-500">
            {registrations.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-blue-900 rounded-[3rem] border border-stone-200 dark:border-blue-800">
                <div className="w-16 h-16 bg-stone-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🎟️</span>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-stone-400 dark:text-blue-400">Belum ada riwayat pendaftaran</p>
                <button onClick={() => setActiveTab('edit')} className="mt-6 text-[10px] font-black uppercase text-red-600 hover:underline">Daftar Sekarang</button>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Tiket Ekspedisi</h2>
                  <p className="text-stone-500 dark:text-blue-300/60 text-sm">Simpan tiket ini sebagai bukti pendaftaran resmi.</p>
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
              onLogout={() => { setIsAdminAuthenticated(false); sessionStorage.removeItem(ADMIN_AUTH_KEY); }} 
              isDarkMode={isDarkMode} 
              onSettingsUpdate={(s) => setFormConfig(s.formConfig)}
              onUpdateStatus={handleUpdateStatus}
            />
          ) : (
            <div className="max-w-md mx-auto bg-white dark:bg-blue-900 p-10 rounded-[3rem] shadow-2xl border border-stone-200 dark:border-blue-800 text-center space-y-8 animate-in slide-in-from-bottom-8">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto text-3xl">🔐</div>
              <div className="space-y-2">
                <h2 className="text-lg font-black uppercase tracking-tight dark:text-white">Otorisasi Admin</h2>
                <p className="text-xs text-stone-500 dark:text-blue-400 uppercase tracking-widest font-bold">Hanya untuk pengelola ekspedisi</p>
              </div>
              <div className="space-y-4">
                <input 
                  type="password" 
                  value={adminPassInput} 
                  onChange={(e) => setAdminPassInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && (adminPassInput === 'admin123' ? (setIsAdminAuthenticated(true), sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')) : setAdminLoginError(true))}
                  placeholder="Masukkan Kata Sandi" 
                  className="w-full px-6 py-4 bg-stone-50 dark:bg-blue-800/50 border-stone-200 dark:border-blue-700 border rounded-2xl text-center font-bold outline-none focus:ring-4 focus:ring-red-500/10 transition-all dark:text-white" 
                />
                {adminLoginError && <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase animate-bounce">Akses Ditolak!</p>}
                <button 
                  onClick={() => adminPassInput === 'admin123' ? (setIsAdminAuthenticated(true), sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')) : setAdminLoginError(true)} 
                  className="w-full py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Login Dashboard
                </button>
              </div>
            </div>
          )
        )}
      </main>

      <footer className="p-10 text-center no-print">
        <p className="text-[10px] font-black text-stone-400 dark:text-blue-300/30 uppercase tracking-[0.5em]">&copy; 2024 Jejak Langkah Adventure. All Rights Reserved.</p>
      </footer>

      <ConfirmationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleSubmit} 
        data={data} 
        isSending={isSending} 
        error={submitError} 
        bankInfo={{bankName: 'BRI', accountNumber: '570401009559504', accountName: 'ILHAM FADHILAH'}} 
      />

      <WelcomePopup isOpen={isWelcomeOpen} onClose={closeWelcome} />
    </div>
  );
};

export default App;
