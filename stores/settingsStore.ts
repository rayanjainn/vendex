import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SystemSettings } from '@/lib/types';

interface SettingsState {
  settings: SystemSettings;
  updateSettings: (settings: Partial<SystemSettings>) => void;
}

const defaultSettings: SystemSettings = {
  rapidApiKey: '',
  preferredCurrency: 'INR',
  countryPriority: ['IN', 'CN'],
  maxResultsPerReel: 20,
  autoConvertCurrency: true,
  enabledPlatforms: ['alibaba', 'aliexpress', 'indiamart'],
  detailedLogging: true
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }))
    }),
    { name: 'vendex-settings' }
  )
);
