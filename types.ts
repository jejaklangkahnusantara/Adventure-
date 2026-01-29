
export interface PersonalData {
  fullName: string;
  email: string;
  whatsapp: string;
  gender: 'male' | 'female' | '';
  climberCode: string;
  mountain: string;
  startDate: string;
  endDate: string;
  tripType: string;
  packageCategory: string;
  extraPorter: boolean;
  identityFile: File | null;
  identityBase64?: string;
  address: string;
  medicalNotes: string;
  status: string;
}

export interface Registration extends Omit<PersonalData, 'identityFile'> {
  id: number;
  timestamp: string;
  identityFile: string;
}

export interface FormConfig {
  mountains: string[];
  tripTypes: string[];
  packageCategories: string[];
}

export interface AdminSettings {
  adminEmail: string;
  adminPassword?: string;
  googleScriptUrl?: string;
  notifyUser: boolean;
  notificationPrefs: {
    notifyAdminOnNew: boolean;
    notifyUserOnNew: boolean;
    statusTriggers: Record<string, boolean>;
  };
  enableAiSummary: boolean;
  formConfig: FormConfig;
  bankAccounts: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface FormErrors {
  [key: string]: string;
}
