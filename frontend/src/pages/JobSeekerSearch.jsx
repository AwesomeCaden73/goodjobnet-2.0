import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Users, MapPin, RotateCcw } from 'lucide-react';
import { PersonCard, JobGroups } from '../components/SearchCards';
import InformationPane from '../components/InformationPane';

import JobTypePicker from '../components/JobTypePicker';
import ZipOnlyToggle from '../components/ZipOnlyToggle';
import { enteredZip, zipOnlySeekers } from '../zipSearch';
import { JOB_TYPES as JOB_OPTIONS } from '../components/jobTypes';

function JobSeekerSearch() {
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState(null);
  const location = useLocation();
  const formRef = useRef(null);
  const resultsRef = useRef(null);
  const requestRef = useRef(null);
  const [error, setError] = useState('');
  const [searchContext, setSearchContext] = useState(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  
  const [savedInputs, setSavedInputs] = useState(() => {
    const saved = sessionStorage.getItem('seeker_search_inputs');
    return saved ? JSON.parse(saved) : { name: '', job_types: [], address: '', radius: '20', other_job_type: '' };
  });

  const [results, setResults] = useState(null);
  useEffect(() => {
    if (!results) return;
    const frame = requestAnimationFrame(() => {
      resultsRef.current?.focus({ preventScroll: true });
      resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [results]);
  const [selectedJobTypes, setSelectedJobTypes] = useState(savedInputs.job_types || []);

  const [selectedSeeker, setSelectedSeeker] = useState(null);
  const [matchingJobs, setMatchingJobs] = useState({ recent: [], older: [] });
  const [matchingJobsLoading, setMatchingJobsLoading] = useState(false);

  const loadMatchingJobs = useCallback(async (seeker) => {
    setSelectedSeeker(seeker);
    setMatchingJobsLoading(true);
    try {
      const response = await fetch(`/api/seeker-matching-jobs?row_index=${seeker.row_index}&job_types=${encodeURIComponent(seeker.job_types || seeker.desired_job_types || '')}&zipcode=${encodeURIComponent(seeker.zipcode || '')}`);
      const data = await response.json();
      if (data.success) {
        setMatchingJobs(data.results);
      } else {
        alert("Failed to load matching jobs: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error while fetching matching jobs.");
    } finally {
      setMatchingJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (results) {
        const nearbyList = results.nearby || [];
        const otherList = results.other || [];
        const totalCount = nearbyList.length + otherList.length;
        if (totalCount === 1) {
          const singleSeeker = nearbyList.length === 1 ? nearbyList[0] : otherList[0];
          loadMatchingJobs(singleSeeker);
        } else {
          setSelectedSeeker(null);
          setMatchingJobs({ recent: [], older: [] });
        }
      } else {
        setSelectedSeeker(null);
        setMatchingJobs({ recent: [], older: [] });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [results, loadMatchingJobs]);

  const performSearch = useCallback(async (searchParams) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    setSelection(null);

    // Store inputs in state & session storage
    const inputs = {
      name: searchParams.name || '',
      job_types: searchParams.job_types || [],
      address: searchParams.address || '',
      radius: searchParams.radius || '20',
      other_job_type: searchParams.other_job_type || '',
      zip_only: searchParams.zip_only === true
    };
    const zip = enteredZip(inputs.address);
    if (inputs.zip_only && !zip) {
      setError('Enter a five-digit ZIP code in Location to use ZIP-only search.');
      setLoading(false);
      formRef.current.elements.address.focus();
      return;
    }
    setSavedInputs(inputs);
    setSelectedJobTypes(inputs.job_types);
    sessionStorage.setItem('seeker_search_inputs', JSON.stringify(inputs));

    const combinedJobTypes = [...inputs.job_types];
    if (inputs.other_job_type && inputs.other_job_type.trim() !== '') {
      const extraTypes = inputs.other_job_type.split(',').map(s => s.trim()).filter(Boolean);
      combinedJobTypes.push(...extraTypes);
    }

    const data = {
      name: inputs.name,
      job_types: combinedJobTypes,
      address: inputs.zip_only ? zip : inputs.address,
      radius: inputs.zip_only ? '0' : inputs.radius
    };

    try {
      const response = await fetch('/api/search-seekers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      const resultData = await response.json();

      if (controller.signal.aborted) return;
      if (response.ok && resultData.success) {
        setSearchContext(inputs);
        const filtered = inputs.zip_only ? zipOnlySeekers(resultData.results, zip) : resultData.results;
        setResults(filtered);
        sessionStorage.setItem('seeker_search_results', JSON.stringify(filtered));
      } else {
        setError(resultData.error || 'Search could not be completed. Please try again.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError('Search could not be completed. Please try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location.state?.autoSearch) {
      sessionStorage.removeItem('seeker_search_results');
      sessionStorage.removeItem('seeker_search_inputs');

      const allJobTypes = location.state.jobTypes || [];
      const matched = allJobTypes.filter(j => JOB_OPTIONS.includes(j));
      const unmatched = allJobTypes.filter(j => !JOB_OPTIONS.includes(j));

      const searchParams = {
        name: '',
        job_types: matched,
        address: location.state.address || '',
        radius: '20',
        other_job_type: unmatched.join(', ')
      };

      setTimeout(() => {
        performSearch(searchParams);
      }, 0);
    } else if (location.state?.keepResults) {
      const savedRes = sessionStorage.getItem('seeker_search_results');
      const savedInp = sessionStorage.getItem('seeker_search_inputs');
      setTimeout(() => {
        if (savedRes) {
          setResults(JSON.parse(savedRes));
        }
        if (savedInp) {
          const parsedInp = JSON.parse(savedInp);
          setSearchContext(parsedInp);
          setSavedInputs(parsedInp);
          setSelectedJobTypes(parsedInp.job_types || []);
        }
      }, 0);
    } else {
      sessionStorage.removeItem('seeker_search_results');
      sessionStorage.removeItem('seeker_search_inputs');
      setTimeout(() => {
        setSavedInputs({ name: '', job_types: [], address: '', radius: '20', other_job_type: '' });
        setSelectedJobTypes([]);
        setResults(null);
      }, 0);
    }
  }, [location.state, performSearch]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const jobTypes = formData.getAll('job_type');
    const otherJobType = formData.get('other_job_type') || '';
    const name = formData.get('name') || '';
    const address = formData.get('address') || '';
    const radius = formData.get('radius') || '20';

    await performSearch({
      name,
      job_types: jobTypes,
      address,
      radius,
      other_job_type: otherJobType,
      zip_only: savedInputs.zip_only === true
    });
  };

  const clearFilters = () => {
    requestRef.current?.abort();
    formRef.current.querySelector('details').open = false;
    setSavedInputs({ name: '', job_types: [], address: '', radius: '20', other_job_type: '' });
    setSelectedJobTypes([]);
    setResults(null);
    setSearchContext(null);
    setSelectedSeeker(null);
    setMatchingJobs({ recent: [], older: [] });
    setLoading(false);
    setError('');
    sessionStorage.removeItem('seeker_search_inputs');
    sessionStorage.removeItem('seeker_search_results');
    formRef.current.elements.name.focus();
  };
  const count = (results?.nearby?.length || 0) + (results?.other?.length || 0);
  const updateInput = field => e => setSavedInputs(previous => ({ ...previous, [field]: e.target.value }));
  return <div className="workspace-page search-page streamlined-seeker-search">
    <div className="page-heading"><div><p className="eyebrow">CONNECT PEOPLE WITH POSSIBILITIES</p><h1>Job Seeker Search</h1><p>Find people by name, job interests, and location.</p></div><Link className="subtle-button" to="/search"><Search size={16} />Universal search</Link></div>
    <section className="surface combined-job-filter"><form ref={formRef} onSubmit={handleSearch} aria-label="Job seeker search filters">
      <div className="job-search-primary">
        <div className="input-group"><label htmlFor="jobseekersearch-name">Name</label><div className="search-field-icon"><Users size={18} /><input id="jobseekersearch-name" name="name" placeholder="Any name" value={savedInputs.name || ''} onChange={updateInput('name')} aria-describedby="seeker-name-hint" /></div></div>
        <div className="input-group"><label htmlFor="jobseekersearch-address">Location</label><div className="search-field-icon"><MapPin size={18} /><input id="jobseekersearch-address" name="address" placeholder="City or address with ZIP code" value={savedInputs.address || ''} onChange={updateInput('address')} aria-describedby="seeker-location-hint" /></div></div>
        <div className="input-group"><label htmlFor="jobseekersearch-radius">Radius (miles)</label><input id="jobseekersearch-radius" name="radius" type="number" value={savedInputs.radius || ''} onChange={updateInput('radius')} min="1" disabled={savedInputs.zip_only === true} required={!savedInputs.zip_only} /></div>
      </div>
      <div className="zip-filter-row"><ZipOnlyToggle id="seeker-zip-only" checked={savedInputs.zip_only === true} onChange={checked => setSavedInputs(previous => ({ ...previous, zip_only: checked }))} /><span className="muted">Match the entered ZIP exactly instead of using a radius.</span></div>
      <div className="job-search-secondary"><JobTypePicker selected={selectedJobTypes} onChange={setSelectedJobTypes} /><div className="input-group"><label htmlFor="jobseekersearch-other_job_type">Additional job types</label><input id="jobseekersearch-other_job_type" name="other_job_type" placeholder="Other roles, separated by commas" value={savedInputs.other_job_type || ''} onChange={updateInput('other_job_type')} /></div></div>
      <div className="job-search-submit"><div className="seeker-filter-hints"><p id="seeker-location-hint" className="muted">Include a five-digit ZIP code to group people by distance.</p><p id="seeker-name-hint" className="muted">Searching by name skips job-type filters.</p></div><div><button type="button" className="subtle-button" onClick={clearFilters}><RotateCcw size={15} />Clear filters</button><button type="submit" className="solid-button" disabled={loading}><Search size={17} />{loading ? 'Searching...' : 'Search job seekers'}</button></div></div>
    </form></section>
    {error && <p className="inline-error" role="alert">{error}</p>}
    {loading && <p className="search-loading" role="status">Searching job seekers...</p>}
    {!loading && results && <section ref={resultsRef} tabIndex={-1} className="job-search-results" aria-labelledby="seeker-results-heading">
      <div className="section-heading"><div><h2 id="seeker-results-heading">Search results <span className="result-count">{count}</span></h2><p>{searchContext?.zip_only ? 'Showing people in ZIP ' + enteredZip(searchContext.address) + ' only.' : 'Select a person to view their profile and edit details.'}</p></div><button type="button" className="text-link" onClick={() => { formRef.current.scrollIntoView({ behavior: 'auto', block: 'center' }); formRef.current.elements.name.focus({ preventScroll: true }); }}>Adjust filters</button></div>
      {count ? [['nearby', searchContext?.name && !searchContext?.address ? 'Name matches' : 'Job seekers within radius'], ['other', 'Other matching job seekers']].map(([key, title]) => <section className="result-section" key={key}><h2>{title} <span className="muted">{results[key]?.length || 0}</span></h2>{key === 'other' && <p>Outside the search radius or without a location.</p>}{results[key]?.length ? <div className="search-result-list">{results[key].map((person, i) => <PersonCard key={person.row_index ?? i} person={person} onSelect={setSelection} />)}</div> : <p className="empty-state">No job seekers in this group match your search.</p>}</section>) : <div className="empty-state search-start"><Search size={28} /><h3>No people match these filters</h3><p>Try another name, a broader job type, or a larger radius.</p></div>}
      {selectedSeeker && <section className="matching-jobs-section"><h2>Matching Jobs for {selectedSeeker.name}</h2><p>Based on desired job types: {selectedSeeker.job_types || selectedSeeker.desired_job_types}</p>{matchingJobsLoading ? <p role="status">Loading matching jobs...</p> : <JobGroups results={matchingJobs} onSelect={setSelection} />}</section>}
    </section>}
    {!loading && !results && <div className="empty-state search-start"><Search size={28} /><h2>Find the people you can help</h2><p>Search by name, or combine job interests and a nearby ZIP code. Leave filters blank to browse.</p></div>}
    {selection && <InformationPane selection={selection} onClose={() => setSelection(null)} />}
  </div>;
}
export default JobSeekerSearch;
