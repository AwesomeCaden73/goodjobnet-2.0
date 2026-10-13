import { getCacheSyncing, subscribeCacheSync } from '../apiCache';
import { BrandMark } from './BrandArtwork';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, CircleHelp, ArrowRight, LogOut, Palette, RefreshCw } from 'lucide-react';
import { visibleApps, launcher } from './navigation';
import ThemeMenu from './ThemeMenu';

function HeaderSearch({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q') || '');
  return <form className="universal-search-box" role="search" onSubmit={e => { e.preventDefault(); navigate('/search?q=' + encodeURIComponent(query.trim())); }}>
    <Search size={19} />
    <input id="workspace-search" aria-label={user ? 'Search jobs, people, and apps' : 'Search jobs and apps'} placeholder={user ? 'Search jobs, people, and apps' : 'Search jobs and apps'} value={query} onChange={e => setQuery(e.target.value)} />
    <kbd>Ctrl K</kbd><button type="submit" className="icon-button" aria-label="Search"><ArrowRight size={17} /></button>
  </form>;
}

export default function Shell({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const syncing = useSyncExternalStore(subscribeCacheSync, getCacheSyncing, () => false);
  const [panelState, setPanelState] = useState(null);
  const panel = panelState?.routeKey === location.key ? panelState.kind : null;
  const setPanel = kind => setPanelState(kind ? { kind, routeKey: location.key } : null);
  const panelRef = useRef(null);
  const available = visibleApps(user);
  const active = available.find(a => a.path === location.pathname);
  const routeNames = { '/map': 'Job map', '/assigned-job-seekers': 'My people', '/dashboard': 'Home', '/employment-dashboard': 'Home', '/job-seeker-dashboard': 'Home', '/job-entry': 'Add opportunity', '/hot-jobs-5review': 'Expiring jobs', '/hot-jobs-46review': 'Expired jobs', '/search': 'Search', '/create': 'Create' };
  const pageTitle = active?.title || (location.pathname === '/apps' ? 'Apps' : routeNames[location.pathname]) || 'Page not found';
  const createArea = ['/create', '/job-entry'].includes(location.pathname);
  const reviewArea = location.pathname.includes('review');
  const jobsArea = ['/hot-job-search', '/map'].includes(location.pathname);
  const peopleArea = ['/job-seeker-search', '/assigned-job-seekers'].includes(location.pathname);
  const railPath = createArea ? '/create' : reviewArea ? '/hot-jobs-review' : jobsArea ? '/hot-job-search' : peopleArea ? '/job-seeker-search' : ['/dashboard', '/employment-dashboard', '/job-seeker-dashboard'].includes(location.pathname) ? '/' : location.pathname;
  const sectionLinks = createArea ? [] : jobsArea ? [available.find(a => a.title === 'Jobs'), { title: 'Job map', path: '/map' }] : peopleArea && user ? [available.find(a => a.title === 'Job seekers'), { title: 'My people', path: '/assigned-job-seekers' }] : [];
  useEffect(() => {
    const shortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('workspace-search')?.focus(); }
      if (e.key === 'Escape') setPanelState(null);
    };
    const outside = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setPanelState(null); };
    document.addEventListener('keydown', shortcut);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', shortcut); document.removeEventListener('pointerdown', outside); };
  }, []);
  useEffect(() => { document.title = pageTitle + ' | GoodJobNet'; }, [pageTitle]);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [location.pathname]);
  const go = () => setPanel(null);
  return <div className="workspace-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="suite-header" ref={panelRef}>
      <Link to="/" className="suite-brand" onClick={go}><BrandMark />GoodJobNet<span className="beta-label">BETA</span></Link>
      <div className="cache-sync-slot" role="status" aria-live="polite">{syncing && <span className="cache-sync-badge"><RefreshCw size={14} aria-hidden="true" />Syncing</span>}</div>
      <HeaderSearch key={location.pathname + location.search} user={user} />
      <div className="header-actions"><Link className="icon-button" to="/help" aria-label="Help"><CircleHelp size={20} /></Link>
        <button type="button" className="icon-button" aria-label="Theme settings" aria-expanded={panel === 'themes'} onClick={() => setPanel(panel === 'themes' ? null : 'themes')}><Palette size={20} /></button>
        {user ? <button className="avatar" aria-label="Account menu" aria-expanded={panel === 'account'} onClick={() => setPanel(panel === 'account' ? null : 'account')}>{user.name.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase()}</button> : <Link className="sign-in-link" to="/login">Sign in <ArrowRight size={15} /></Link>}
      </div>
      {panel === 'themes' && <ThemeMenu onClose={go} />}
      {panel === 'account' && user && <div className="account-popover"><strong>{user.name}</strong><p>{user.role} {user.ward && '· ' + user.ward}</p>{user.email && <p>{user.email}</p>}<button className="subtle-button" onClick={() => { go(); onLogout(); navigate('/login'); }}><LogOut size={17} /> Sign out</button></div>}
    </header>
    <nav className="app-rail" aria-label="Main navigation">{[...available.filter(a => a.title !== 'Help'), launcher].map(({ title, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} className={'rail-item ' + (railPath === path ? 'active' : '')} aria-current={railPath === path ? 'page' : undefined} onClick={go}><Icon size={22} strokeWidth={1.65} /><span>{title}</span></NavLink>)}<NavLink className="rail-item rail-help" to="/help"><CircleHelp size={22} /><span>Help</span></NavLink></nav>
    <main id="main-content" className="workspace-main" key={location.pathname} tabIndex={-1}>{sectionLinks.length > 0 && <nav className="section-navigation" aria-label={createArea ? 'Create tools' : jobsArea ? 'Opportunity tools' : 'People tools'}>{sectionLinks.filter(Boolean).map(item => <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive || (item.path === '/hot-jobs-review' && location.pathname.includes('review')) ? 'active' : ''}>{item.title}</NavLink>)}</nav>}<Outlet /></main>
  </div>;
}

