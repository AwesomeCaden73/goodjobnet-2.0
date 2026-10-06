import { Check, Moon, X } from 'lucide-react';
import { themes, useTheme } from './ThemeContext';

export default function ThemeMenu({ onClose }) {
  const { theme, setTheme } = useTheme();
  return <section className="theme-popover" aria-label="Theme settings"><div className="section-heading"><h2>Make it yours</h2><button type="button" className="icon-button" aria-label="Close theme settings" onClick={onClose}><X size={18} /></button></div><p>Choose your workspace colors.</p><fieldset className="theme-options"><legend>Color theme</legend>{themes.map(([key, label]) => <label key={key} className={'theme-option ' + (theme.palette === key ? 'selected' : '')}><input type="radio" name="color-theme" value={key} checked={theme.palette === key} onChange={() => setTheme(previous => ({ ...previous, palette: key }))} /><span className={'theme-swatch swatch-' + key} /><span>{label}</span>{theme.palette === key && <Check size={16} />}</label>)}</fieldset><label className="dark-mode-control"><Moon size={19} /><span>Dark mode</span><input type="checkbox" role="switch" checked={theme.dark} onChange={e => setTheme(previous => ({ ...previous, dark: e.target.checked }))} /><span className="theme-switch" aria-hidden="true" /></label><p className="muted">Your preferences are saved on this browser.</p></section>;
}
