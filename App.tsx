
import React, { useState, useEffect } from 'react';
import { PersonalData, Registration, AdminSettings, FormConfig, FormErrors } from './types';
import Input from './components/Input';
import Select from './components/Select';
import RadioGroup from './components/RadioGroup';
import AdminDashboard from './components/AdminDashboard';
import ConfirmationModal from './components/ConfirmationModal';
import ETicketCard from './components/ETicketCard';
import { getMountainAdvice } from './services/geminiService';

const DEFAULT_ADMIN_EMAIL = "jejaklangkah.nusantara.id@gmail.com";
const THEME_KEY = 'jejak_langkah_theme';
const DB_KEY = 'jejak_langkah_registrations';
const ADMIN_AUTH_KEY = 'jejak_langkah_admin_auth';
const SETTINGS_KEY = 'jejak_langkah_admin_settings';

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
  }, []);

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
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col text-stone-900 dark:text-stone-100 transition-colors duration-500">
      <header className="bg-red-700 dark:bg-red-950 p-6 sticky top-0 z-50 shadow-xl no-print">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center rotate-3 shadow-lg">
              <svg viewBox="0 0 500 500" className="w-8 h-8 fill-red-700"><path d="M250 80 L420 380 L380 380 L250 150 L120 380 L80 380 Z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Jejak Langkah</h1>
              <p className="text-[9px] font-bold text-red-200 uppercase tracking-widest mt-1">Adventure Expedition</p>
            </div>
          </div>
          <nav className="flex bg-black/20 p-1.5 rounded-2xl backdrop-blur-sm">
            {[
              {id: 'edit', label: 'Form'},
              {id: 'preview', label: 'E-Ticket'},
              {id: 'admin', label: 'Admin'}
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-red-700 shadow-md scale-105' : 'text-white/60 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="ml-2 p-2 text-white/60 hover:text-white">
              {isDarkMode ? '🌞' : '🌙'}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-10">
        {activeTab === 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
            <div className="space-y-6">
              <section className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-sm border border-stone-200 dark:border-stone-800 space-y-6">
                <h2 className="text-sm font-black flex items-center gap-3 uppercase tracking-widest"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Informasi Utama</h2>
                <Select label="Destinasi Gunung" name="mountain" options={formConfig.mountains} value={data.mountain} onChange={handleInputChange} error={errors.mountain} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Nama Lengkap" name="fullName" value={data.fullName} onChange={handleInputChange} placeholder="Sesuai Kartu Identitas" error={errors.fullName} />
                  <Input 
                    label="Kode Pendaki / NIK" 
                    name="climberCode" 
                    value={data.climberCode} 
                    onChange={handleInputChange} 
                    placeholder="ID Unik / Nomor NIK" 
                    error={errors.climberCode} 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="WhatsApp" name="whatsapp" value={data.whatsapp} onChange={handleInputChange} placeholder="Contoh: 0812..." error={errors.whatsapp} />
                  <Input label="Email Aktif" name="email" type="email" value={data.email} onChange={handleInputChange} placeholder="Untuk notifikasi e-ticket" error={errors.email} />
                </div>
                <Input 
                  label="Alamat Lengkap" 
                  isTextArea 
                  name="address" 
                  value={data.address} 
                  onChange={handleInputChange} 
                  placeholder="Alamat domisili saat ini..." 
                  error={errors.address} 
                />
              </section>
              
              <section className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-sm border border-stone-200 dark:border-stone-800 space-y-6">
                <h2 className="text-sm font-black flex items-center gap-3 uppercase tracking-widest text-stone-400">Logistik & Keamanan</h2>
                <Input 
                  label="Catatan Kesehatan" 
                  isTextArea 
                  name="medicalNotes" 
                  value={data.medicalNotes} 
                  onChange={handleInputChange} 
                  placeholder="Riwayat asma, alergi, atau cedera..." 
                  maxLength={150} 
                  action={<button type="button" onClick={handleAdviceRequest} className="text-[9px] font-black text-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full uppercase transition-all hover:scale-105">Analisis AI</button>} 
                />
                {advice && <div className="p-5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 text-[11px] leading-relaxed italic animate-in slide-in-from-top-2">{advice}</div>}
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-sm border border-stone-200 dark:border-stone-800 space-y-8">
                <h2 className="text-sm font-black flex items-center gap-3 uppercase tracking-widest text-stone-400">Konfigurasi Trip</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Berangkat" type="date" name="startDate" value={data.startDate} onChange={handleInputChange} error={errors.startDate} />
                  <Input label="Kembali" type="date" name="endDate" value={data.endDate} onChange={handleInputChange} />
                </div>
                <RadioGroup label="Jenis Perjalanan" options={formConfig.tripTypes} value={data.tripType} onChange={(v) => setData(p => ({ ...p, tripType: v }))} />
                <RadioGroup label="Pilihan Paket" options={formConfig.packageCategories} value={data.packageCategory} onChange={(v) => setData(p => ({ ...p, packageCategory: v }))} />
                
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-3">Unggah Identitas (KTP/Passport)</label>
                  <div className="relative group">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="p-6 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl text-center group-hover:border-red-500 transition-all">
                      <p className="text-[10px] font-bold text-stone-400 uppercase">{data.identityFile ? `File: ${data.identityFile.name}` : 'Klik untuk Pilih File'}</p>
                    </div>
                  </div>
                </div>
              </section>

              <button 
                onClick={() => validate() && setIsModalOpen(true)} 
                className="w-full py-6 bg-red-700 hover:bg-red-800 text-white font-black text-xs uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
              >
                Daftar Sekarang
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="max-w-xl mx-auto py-10 animate-in fade-in zoom-in-95 duration-500">
            {registrations.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-200 dark:border-stone-800">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-stone-300">Belum ada riwayat pendaftaran</p>
              </div>
            ) : (
              <div className="space-y-12">
                <h2 className="text-2xl font-black uppercase text-center tracking-tighter">Ekspedisi Terdaftar</h2>
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
              onUpdateStatus={(id, status) => {
                const updated = registrations.map(r => r.id === id ? {...r, status} : r);
                setRegistrations(updated);
                localStorage.setItem(DB_KEY, JSON.stringify(updated));
              }}
            />
          ) : (
            <div className="max-w-md mx-auto bg-white dark:bg-stone-900 p-10 rounded-[3rem] shadow-2xl border border-stone-200 dark:border-stone-800 text-center space-y-6 animate-in slide-in-from-bottom-8">
              <h2 className="text-lg font-black uppercase tracking-tight">Otorisasi Admin</h2>
              <input 
                type="password" 
                value={adminPassInput} 
                onChange={(e) => setAdminPassInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && (adminPassInput === 'admin123' ? (setIsAdminAuthenticated(true), sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')) : setAdminLoginError(true))}
                placeholder="Kata Sandi" 
                className="w-full px-6 py-4 bg-stone-50 dark:bg-stone-800 border rounded-2xl text-center font-bold outline-none focus:ring-2 focus:ring-red-500" 
              />
              {adminLoginError && <p className="text-[10px] font-bold text-red-600 uppercase">Akses Ditolak!</p>}
              <button 
                onClick={() => adminPassInput === 'admin123' ? (setIsAdminAuthenticated(true), sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')) : setAdminLoginError(true)} 
                className="w-full py-4 bg-red-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-red-800 transition-all"
              >
                Masuk Dashboard
              </button>
            </div>
          )
        )}
      </main>

      <ConfirmationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleSubmit} 
        data={data} 
        isSending={isSending} 
        error={submitError} 
        bankInfo={{bankName: 'BRI', accountNumber: '570401009559504', accountName: 'ILHAM FADHILAH'}} 
      />
    </div>
  );
};

export default App;
