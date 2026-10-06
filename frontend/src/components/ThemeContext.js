import { createContext, useContext } from 'react';
export const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);
export const themes = [['purple', 'Purple'], ['cyan', 'Dark cyan'], ['orange', 'Orange'], ['green', 'Green']];
export function readTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem('goodjobnet_theme'));
    return { palette: themes.some(([key]) => key === saved?.palette) ? saved.palette : 'purple', dark: saved?.dark === true };
  } catch { return { palette: 'purple', dark: false }; }
}
