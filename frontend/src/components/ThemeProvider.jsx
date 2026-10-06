import { useEffect, useState } from 'react';
import { ThemeContext, readTheme } from './ThemeContext';

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme.palette;
    document.documentElement.dataset.mode = theme.dark ? 'dark' : 'light';
    try { localStorage.setItem('goodjobnet_theme', JSON.stringify(theme)); } catch { /* Preferences still work when browser storage is unavailable. */ }
  }, [theme]);
  useEffect(() => {
    const sync = e => { if (e.key === 'goodjobnet_theme' || e.key === null) setTheme(readTheme()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
