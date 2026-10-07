import { checkedJobResults } from '../jobSearchResults';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BriefcaseBusiness, MapPin, RotateCcw } from 'lucide-react';
import { JobGroups } from '../components/SearchCards';
import JobTypePicker from '../components/JobTypePicker';
import InformationPane from '../components/InformationPane';
import { hotJobFilters } from '../hotJobFilters';
import { enteredZip } from '../zipSearch';
import ZipOnlyToggle from '../components/ZipOnlyToggle';

export default function HotJobSearch({ user }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selection, setSelection] = useState(null);
  const [jobTypes, setJobTypes] = useState([]);
  const [error, setError] = useState('');
  const [zipOnly, setZipOnly] = useState(false);
  const [searched, setSearched] = useState(null);
  const resultsRef = useRef(null);
  const formRef = useRef(null);
  const requestRef = useRef(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (!results) return;
    const frame = requestAnimationFrame(() => {
      resultsRef.current?.focus({ preventScroll: true });
      resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [results]);

  const handleSearch = async e => {
    e.preventDefault();
    const data = hotJobFilters(new FormData(e.currentTarget), { zipOnly });
    const zip = enteredZip(data.address);
    if (zipOnly && !zip) {
      setError('Enter a five-digit ZIP code in Location to use ZIP-only search.');
      formRef.current.elements.address.focus();
      return;
    }
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    setSelection(null);
    try {
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      const resultData = await response.json();
      if (!response.ok || !resultData.success) throw new Error(resultData.error || 'Search could not be completed. Please try again.');
      if (controller.signal.aborted) return;
      const checked = checkedJobResults(resultData.results);
      if (controller.signal.aborted) return;
      setSearched({ ...data, zipOnly, zip });
      setResults(checked);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Search could not be completed. Please try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };
  const clearFilters = () => {
    requestRef.current?.abort();
    formRef.current.reset();
    formRef.current.querySelector('details').open = false;
    setZipOnly(false);
    setJobTypes([]);
    setResults(null);
    setSearched(null);
    setError('');
    setLoading(false);
    formRef.current.elements.company_name.focus();
  };
  const count = (results?.recent?.length || 0) + (results?.older?.length || 0);
  return <div className="workspace-page search-page streamlined-job-search">
    <div className="page-heading"><div><p className="eyebrow">FIND YOUR NEXT OPPORTUNITY</p><h1>Job Search</h1><p>Find the right opportunity. Use any combination of filters.</p></div><Link className="subtle-button" to="/search"><Search size={16} />Universal search</Link></div>
    <section className="surface combined-job-filter"><form ref={formRef} onSubmit={handleSearch} aria-label="Job search filters">
      <div className="job-search-primary"><div className="input-group"><label htmlFor="hotjobsearch-company_name">Company</label><div className="search-field-icon"><BriefcaseBusiness size={18} /><input id="hotjobsearch-company_name" name="company_name" placeholder="Any company" /></div></div><div className="input-group"><label htmlFor="hotjobsearch-address">Location</label><div className="search-field-icon"><MapPin size={18} /><input id="hotjobsearch-address" name="address" placeholder="City or address with ZIP code" aria-describedby="job-location-hint" /></div></div><div className="input-group"><label htmlFor="hotjobsearch-radius">Radius (miles)</label><input id="hotjobsearch-radius" type="number" name="radius" defaultValue="20" min="1" disabled={zipOnly} required={!zipOnly} /></div></div>
      <div className="zip-filter-row"><ZipOnlyToggle id="job-zip-only" checked={zipOnly} onChange={setZipOnly} /><span className="muted">Match the entered ZIP exactly instead of using a radius.</span></div>
      <div className="job-search-secondary"><JobTypePicker selected={jobTypes} onChange={setJobTypes} /><div className="input-group"><label htmlFor="hotjobsearch-other_job_type">Additional job type</label><input id="hotjobsearch-other_job_type" name="other_job_type" placeholder="Any role or job type" /></div></div>
      <div className="job-search-submit"><p id="job-location-hint" className="muted">Include a five-digit ZIP code to search by distance.</p><div><button type="button" className="subtle-button" onClick={clearFilters}><RotateCcw size={15} />Clear filters</button><button type="submit" className="solid-button" disabled={loading}><Search size={17} />{loading ? 'Searching…' : 'Search jobs'}</button></div></div>
    </form></section>
    {error && <p className="inline-error" role="alert">{error}</p>}
    {loading && <p className="search-loading" role="status">Searching opportunities…</p>}
    {!loading && results && <section ref={resultsRef} tabIndex={-1} className="job-search-results" aria-labelledby="job-results-heading"><div className="section-heading"><div><h2 id="job-results-heading">Search results <span className="result-count">{count}</span></h2><p>{searched?.zipOnly ? 'Showing jobs in ZIP ' + searched.zip + ' only.' : searched?.search_type === 'company' ? 'Company matches across all verification dates.' : 'Matching opportunities verified within the past two years, or with no readable verification date.'}</p></div><button type="button" className="text-link" onClick={() => { formRef.current.scrollIntoView({ behavior: 'auto', block: 'center' }); formRef.current.elements.company_name.focus({ preventScroll: true }); }}>Adjust filters</button></div><>{count ? <JobGroups results={results} onSelect={setSelection} /> : <div className="empty-state search-start"><Search size={28} /><h3>No opportunities match these filters</h3><p>Try a broader company name, another job type, or a larger radius.</p></div>}</></section>}
    {!loading && !results && <div className="empty-state search-start"><Search size={28} /><h2>Your next opportunity is out there</h2><p>Start with a company, a job type, or a nearby ZIP code. Leave filters blank to browse.</p></div>}
    {selection && <InformationPane canEdit={!!user} selection={selection} onClose={() => setSelection(null)} />}
  </div>;
}
