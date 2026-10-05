import { UIPreferences } from '../../types/auth';

const STORAGE_KEY = 'reinos_oniricos_ui_preferences_v1';

export const DEFAULT_UI_PREFERENCES: Required<Omit<UIPreferences, 'theme'>> = {
  density: 'comfortable',
  textScale: 'normal',
  reduceMotion: false
};

export const normalizeUIPreferences = (value?: UIPreferences | null): UIPreferences => ({
  theme: value?.theme,
  density: value?.density === 'compact' ? 'compact' : 'comfortable',
  textScale:
    value?.textScale === 'small' || value?.textScale === 'large'
      ? value.textScale
      : 'normal',
  reduceMotion: Boolean(value?.reduceMotion)
});

export const applyUIPreferences = (value?: UIPreferences | null) => {
  if (typeof document === 'undefined') return;
  const prefs = normalizeUIPreferences(value);
  document.documentElement.dataset.density = prefs.density;
  document.documentElement.dataset.textScale = prefs.textScale;
  document.documentElement.dataset.reduceMotion = prefs.reduceMotion ? 'true' : 'false';
};

export const loadLocalUIPreferences = (): UIPreferences => {
  if (typeof window === 'undefined') return normalizeUIPreferences();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeUIPreferences(JSON.parse(raw)) : normalizeUIPreferences();
  } catch {
    return normalizeUIPreferences();
  }
};

export const saveLocalUIPreferences = (value: UIPreferences) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeUIPreferences(value)));
};
