
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
  const [adminUserInput, setAdminUserInput] = useState('');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ 
          ...prev, 
          identityFile: file, 
          identityBase64: reader.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!data.fullName) newErrors.fullName = "Wajib diisi";
    if (!data.whatsapp) newErrors.whatsapp = "Wajib diisi";
    if (!data.mountain) newErrors.mountain = "Pilih tujuan";
    if (!data.startDate) newErrors.startDate = "Wajib diisi";
    if (!data.tripType) newErrors.tripType = "Pilih tipe trip";
    if (!data.identityBase64) newErrors.identityFile = "Upload KTP/Identitas";
    
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
    let isSynced = false;

    try {
      const settingsStr = localStorage.getItem(SETTINGS_KEY);
      const settings: AdminSettings | null = settingsStr ? JSON.parse(settingsStr) : null;
      
      const newReg: Registration = {
        ...data,
        id: Date.now(),
        timestamp: new Date().toLocaleString('id-ID'),
        identityFile: data.identityBase64 || '',
        status: 'Menunggu Verifikasi',
        isSynced: false
      };

      if (settings?.googleScriptUrl) {
        try {
          const notificationPrefs = settings.notificationPrefs || {
            notifyAdminOnNew: true,
            notifyUserOnNew: true,
            statusTriggers: {}
          };

          const payload = { 
            action: 'NEW_REGISTRATION', 
            registration: newReg, 
            adminEmail: settings.adminEmail || DEFAULT_ADMIN_EMAIL,
            notificationPrefs: notificationPrefs
          };

          await fetch(settings.googleScriptUrl.trim(), {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
          });
          isSynced = true;
        } catch (syncErr) {
          console.error("Cloud Sync Failed, saving locally:", syncErr);
        }
      }

      const finalReg = { ...newReg, isSynced };
      const updatedRegs = keepHistory ? [...registrations, finalReg] : [finalReg];
      setRegistrations(updatedRegs);
      localStorage.setItem(DB_KEY, JSON.stringify(updatedRegs));

      setIsModalOpen(false);
      setData(initialData);
      setActiveTab('preview');
    } catch (err) {
      setSubmitError('Terjadi gangguan sistem.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAdminLogin = () => {
    const settingsStr = localStorage.getItem(SETTINGS_KEY);
    const settings = settingsStr ? JSON.parse(settingsStr) : { adminUsername: 'Jejak Langkah', adminPassword: 'JejakLangkah25' };
    
    const targetUser = settings.adminUsername || 'Jejak Langkah';
    const targetPass = settings.adminPassword || 'JejakLangkah25';

    if (adminUserInput === targetUser && adminPassInput === targetPass) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      setAdminPassInput('');
      setAdminUserInput('');
    } else {
      alert('Username atau Password salah!');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-inter selection:bg-accent selection:text-white transition-colors duration-500 ${isDarkMode ? 'bg-midnight text-stone-100' : 'bg-stone-50 text-stone-900'}`}>
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
              { id: 'admin', label: 'Admin' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-stone-500 hover:text-stone-400'}`}
              >
                {tab.label}
              </button>
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
            <div className="mb-10 md:mb-20 text-center md:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-[9px] font-black uppercase tracking-[0.3em] mb-4">JEJAK LANGKAH ADVENTURE</span>
              <h2 className={`text-4xl md:text-7xl font-black leading-[0.9] tracking-tighter ${isDarkMode ? 'text-white' : 'text-stone-900'}`}>
                MULAI <span className="text-accent">PENDAKIAN</span> ANDA.
              </h2>
              <p className="mt-6 text-stone-500 text-sm md:text-lg font-medium max-w-2xl mx-auto md:mx-0 leading-relaxed">
                Bergabunglah dalam ekspedisi profesional Jejak Langkah Adventure. Keamanan Anda adalah prioritas utama kami.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
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
                  <div className="mb-8">
                    <label className={`block text-[10px] font-black uppercase tracking-[0.15em] mb-3 px-1 ${errors.identityFile ? 'text-red-500' : 'text-stone-500'}`}>
                      Identitas (KTP / Passport)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${isDarkMode ? 'bg-midnight/40 border-stone-800 hover:border-accent/40' : 'bg-stone-50 border-stone-200 hover:border-accent/40'}`}>
                          {data.identityBase64 ? (
                            <div className="relative w-full h-full p-2 group">
                              <img src={data.identityBase64} alt="Identity Preview" className="w-full h-full object-contain rounded-[1.5rem]" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem] flex items-center justify-center">
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">Ganti File</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg className="w-8 h-8 mb-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                              <p className="mb-2 text-sm text-stone-500"><span className="font-semibold">Klik untuk upload</span></p>
                              <p className="text-xs text-stone-400">PNG, JPG up to 5MB</p>
                            </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                        {errors.identityFile && <p className="mt-2 text-[9px] font-black text-red-500 uppercase tracking-widest px-1">{errors.identityFile}</p>}
                      </div>
                    </div>
                  </div>
                  <Input label="Alamat Domisili" isTextArea name="address" value={data.address} onChange={handleInputChange} placeholder="Alamat lengkap saat ini..." />
                </div>
              </div>

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
              <div className={`max-w-md mx-auto p-12 rounded-[3.5rem] border text-center shadow-2xl space-y-8 transition-all duration-500 ${isDarkMode ? 'bg-slate-900/60 border-stone-800' : 'bg-white border-stone-100'}`}>
                <div className="w-20 h-20 bg-accent/10 rounded-[2rem] flex items-center justify-center mx-auto text-accent">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-2">Admin Portal</h2>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest leading-relaxed">Masukkan kredensial administrator untuk akses kontrol sistem.</p>
                </div>
                
                <div className="space-y-4">
                  <Input 
                    label="Username"
                    name="adminUsername"
                    value={adminUserInput} 
                    onChange={(e) => setAdminUserInput(e.target.value)}
                    placeholder="Masukkan Username" 
                  />
                  <Input 
                    label="Password"
                    type="password"
                    name="adminPassword"
                    value={adminPassInput} 
                    onChange={(e) => setAdminPassInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    placeholder="Masukkan Password" 
                  />
                </div>

                <button 
                  onClick={handleAdminLogin}
                  className="w-full py-5 bg-stone-900 dark:bg-accent text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-[1.8rem] shadow-xl active:scale-95 transition-all"
                >
                  Otorisasi Sekarang
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
                onUpdateRegistrations={(updated) => {
                  setRegistrations(updated);
                  localStorage.setItem(DB_KEY, JSON.stringify(updated));
                }}
                onClearAll={() => { if(confirm('Hapus semua data?')) { setRegistrations([]); localStorage.removeItem(DB_KEY); }}}
              />
            )}
          </div>
        )}
      </main>

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
