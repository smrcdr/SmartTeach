import { ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

const themeStorageKey = 'smarteach.theme'
const theme = ref<ThemeMode>('light')

function getStoredTheme(): ThemeMode | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  const stored = localStorage.getItem(themeStorageKey)

  return stored === 'dark' || stored === 'light' ? stored : null
}

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme()
}

export function setTheme(nextTheme: ThemeMode) {
  theme.value = nextTheme

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = nextTheme
    document.documentElement.style.colorScheme = nextTheme
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(themeStorageKey, nextTheme)
  }
}

export function initializeTheme() {
  setTheme(getInitialTheme())
}

export function toggleTheme() {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

export function useTheme() {
  return {
    theme,
    toggleTheme,
    setTheme
  }
}
