import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Users, ArrowUpRight, MapPin } from 'lucide-react';
import { visibleApps } from '../components/navigation';
import { searchWorkspace } from '../search';
import { JobCard, PersonCard } from '../components/SearchCards';
import InformationPane from '../components/InformationPane';

export default function UniversalSearch({ user }) {
  const [params] = useSearchParams();
  const query = (params.get('q') || '').trim();
  return <SearchResults key={query} query={query} user={user} />;
}
function SearchResults({ query, user }) {
  const [selection, setSelection] = useState(null);
  const [tab, setTab] = useState('All');
  const [data, setData] = useState({ jobs: [], people: [], errors: [] });
  const [loading, setLoading] = useState(Boolean(query));
  const [limit, setLimit] = useState(30);
  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    searchWorkspace(query, user, controller.signal).then(result => { setData(result); setLoading(false); }).catch(error => {
      if (error.name !== 'AbortError') { setData({ jobs: [], people: [], errors: ['Search could not be completed. Please try again.'] }); setLoading(false); }
    });
    return () => controller.abort();
  }, [query, user]);
  const apps = visibleApps(user).filter(a => (a.title + ' ' + a.description).toLowerCase().includes(query.toLowerCase()));
  const count = data.jobs.length + data.people.length + apps.length;
  return <div className="workspace-page search-page"><div className="page-heading"><div><p className="eyebrow">ONE SEARCH. MORE POSSIBILITIES.</p><h1>{query ? 'Results for “' + query + '”' : 'What are you looking for?'}</h1><p>{query ? 'Jobs, people, and the tools to bring them together.' : 'Search for a company, role, person, or app in the bar above.'}</p></div></div>
    <div className="search-tabs" aria-label="Result types">{['All', 'Jobs', ...(user ? ['People'] : []), 'Apps'].map(label => <button key={label} className={tab === label ? 'selected' : ''} aria-pressed={tab === label} onClick={() => { setTab(label); setLimit(30); }}>{label}<span>{label === 'All' ? count : label === 'Jobs' ? data.jobs.length : label === 'People' ? data.people.length : apps.length}</span></button>)}</div>
    {loading && <div className="search-loading" role="status"><Search className="search-pulse" size={24} /><p>Searching {user ? 'jobs and people' : 'jobs'}…</p></div>}
    {data.errors.map(error => <p key={error} className="inline-error" role="alert">{error}</p>)}
    {(!query || !loading) && (tab === 'All' || tab === 'Apps') && apps.length > 0 && <section className="result-section"><h2>Apps</h2><div className="search-apps">{apps.map(({ title, path, icon: Icon, color }) => <Link className="surface search-app" to={path} key={path}><span className={'app-icon small ' + color}><Icon size={21} /></span>{title}<ArrowUpRight size={16} /></Link>)}</div></section>}
    {!loading && query && (tab === 'All' || tab === 'Jobs') && <section className="result-section"><div className="section-heading"><h2>Job opportunities <span className="muted">{data.jobs.length}</span></h2><Link className="text-link" to="/hot-job-search">Search by location <MapPin size={15} /></Link></div>{data.jobs.length ? <div className="search-result-list">{data.jobs.slice(0, limit).map((job, i) => <JobCard key={i} job={job} onSelect={setSelection} />)}</div> : <p className="empty-state">No jobs match this search. Try another company or role.</p>}</section>}
    {!loading && query && user && (tab === 'All' || tab === 'People') && <section className="result-section"><h2>Job seekers <span className="muted">{data.people.length}</span></h2>{data.people.length ? <div className="search-result-list">{data.people.slice(0, limit).map(person => <PersonCard key={person.row_index} person={person} onSelect={setSelection} />)}</div> : <p className="empty-state">No people match this name or job type.</p>}</section>}
    {!loading && tab === 'Apps' && apps.length === 0 && <p className="empty-state">No apps match this search. Try “jobs”, “people”, or “help”.</p>}
    {!loading && (((tab === 'All' || tab === 'Jobs') && data.jobs.length > limit) || ((tab === 'All' || tab === 'People') && data.people.length > limit)) && <button className="subtle-button" onClick={() => setLimit(limit + 30)}>Show more results</button>}
    {!user && <div className="search-signin"><Users size={20} /><p>Supporting job seekers? <Link to="/login">Sign in</Link> to search people and access your workspace.</p></div>}
    {selection && <InformationPane canEdit={!!user} selection={selection} onClose={() => setSelection(null)} returnTo={'/search?q=' + encodeURIComponent(query)} />}
  </div>;
}

