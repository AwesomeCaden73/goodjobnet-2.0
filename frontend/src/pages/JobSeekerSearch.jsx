import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { PersonCard, JobGroups } from '../components/SearchCards';
import InformationPane from '../components/InformationPane';

const JOB_OPTIONS = [
  "HVAC Repair", "Accountant", "Airport (Baggage/customer service/ground ops)",
  "Auto Parts", "Car Wash Attendant", "Cashier", "Catering", "CDL Driver",
  "Cement Mason/finisher", "Computer / IT", "Computer Programmer", "Construction",
  "Corrections", "Custodian", "Customer service", "Data Entry", "Day Care / Preschool",
  "Delivery Driver", "Drywaller", "Educator", "Electrician", "Engineering",
  "Event Staff", "Fast food", "Gas Station Attendant", "Grocery Store",
  "Healthcare", "Hotel/Hospitality", "Housekeeper", "Information Technology (IT)",
  "Landscaping", "Manager (Department/Project)", "Manager (Store/Crew)", "Mechanic",
  "Manufacturing", "Nursing", "Painter", "Pest Control", "Plumbing",
  "Restaurant (Cook/Waiter/Host)", "Retail", "Sales", "Security", "Stocking",
  "Telephone/Call Center/Scheduling", "Theme Park", "Trucking/Transportation",
  "Warehousing/Logistics"
];

function JobSeekerSearch() {
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState(null);
  const location = useLocation();
  
  const [savedInputs, setSavedInputs] = useState(() => {
    const saved = sessionStorage.getItem('seeker_search_inputs');
    return saved ? JSON.parse(saved) : { name: '', job_types: [], address: '', radius: '20', other_job_type: '' };
  });

  const [results, setResults] = useState(null);
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
    setLoading(true);
    
    // Store inputs in state & session storage
    const inputs = {
      name: searchParams.name || '',
      job_types: searchParams.job_types || [],
      address: searchParams.address || '',
      radius: searchParams.radius || '20',
      other_job_type: searchParams.other_job_type || ''
    };
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
      address: inputs.address,
      radius: inputs.radius
    };

    try {
      const response = await fetch('/api/search-seekers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resultData = await response.json();

      if (resultData.success) {
        setResults(resultData.results);
        sessionStorage.setItem('seeker_search_results', JSON.stringify(resultData.results));
      } else {
        alert('Search failed: ' + (resultData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error - Is your backend server running?');
    } finally {
      setLoading(false);
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
      other_job_type: otherJobType
    });
  };

  return <div className="workspace-page search-page advanced-search-page">
    <div className="page-heading"><div><p className="eyebrow">CONNECT PEOPLE WITH POSSIBILITIES</p><h1>Job Seeker Search</h1><p>Find people by name, job interests, and location.</p></div><Link className="subtle-button" to="/search"><Search size={16} />Universal search</Link></div>
    <section className="surface search-filter-panel"><h2><SlidersHorizontal size={18} />Search filters</h2>
        <form onSubmit={handleSearch}>
          <div className="form-grid">
            <div className="input-group full-width">
              <label htmlFor="jobseekersearch-name">Search by Name (Optional - Bypasses job types and location filters)</label>
              <input id="jobseekersearch-name" type="text" name="name" placeholder="Enter seeker name..." value={savedInputs.name || ''} onChange={e => setSavedInputs(previous => ({ ...previous, name: e.target.value }))} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.6rem', fontWeight: '500' }}>
                OR, search by job type(s) and radius from given location
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="jobseekersearch-job_type">Job Type (Hold Ctrl/Cmd to select multiple)</label>
              <select id="jobseekersearch-job_type"
                name="job_type" 
                multiple 
                size="4"
                value={selectedJobTypes}
                onChange={e => setSelectedJobTypes(Array.from(e.target.selectedOptions, opt => opt.value))}
              >
                {JOB_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="jobseekersearch-address">Find individuals near this location (Street, City, Zipcode)</label>
              <textarea id="jobseekersearch-address" name="address" rows="4" placeholder="Enter full address including zip code... (e.g. 32801)" value={savedInputs.address || ''} onChange={e => setSavedInputs(previous => ({ ...previous, address: e.target.value }))}></textarea>
            </div>

            <div className="input-group">
              <label htmlFor="jobseekersearch-other_job_type">Other Job Type (Not in list)</label>
              <input id="jobseekersearch-other_job_type" type="text" name="other_job_type" placeholder="Enter other job type..." value={savedInputs.other_job_type || ''} onChange={e => setSavedInputs(previous => ({ ...previous, other_job_type: e.target.value }))} />
            </div>

            <div className="input-group">
              <label htmlFor="jobseekersearch-radius">List individuals within radius of (miles)</label>
              <input id="jobseekersearch-radius" type="number" name="radius" value={savedInputs.radius || ''} onChange={e => setSavedInputs(previous => ({ ...previous, radius: e.target.value }))} min="1" required />
            </div>
          </div>

          <div className="filter-actions"><button type="submit" className="solid-button" disabled={loading}><Search size={17} />{loading ? 'Searching...' : 'Search job seekers'}</button><span className="muted">Select a person to view their profile and edit details.</span></div>
        </form>
    </section>
    {loading && <p className="search-loading" role="status">Searching job seekers...</p>}
    {!loading && results && <>
      {[['nearby', 'Job seekers within radius'], ['other', 'Other matching job seekers']].map(([key, title]) => <section className="result-section" key={key}><h2>{title} <span className="muted">{results[key]?.length || 0}</span></h2>{key === 'other' && <p>Outside the search radius or without a location.</p>}{results[key]?.length ? <div className="search-result-list">{results[key].map((person, i) => <PersonCard key={person.row_index ?? i} person={person} onSelect={setSelection} />)}</div> : <p className="empty-state">No job seekers in this group match your search.</p>}</section>)}
      {selectedSeeker && <section className="matching-jobs-section"><h2>Matching Jobs for {selectedSeeker.name}</h2><p>Based on desired job types: {selectedSeeker.job_types || selectedSeeker.desired_job_types}</p>{matchingJobsLoading ? <p role="status">Loading matching jobs...</p> : <JobGroups results={matchingJobs} onSelect={setSelection} />}</section>}
    </>}
    {!loading && !results && <div className="empty-state search-start"><Search size={28} /><h2>Find the people you can help</h2><p>Search by name, or combine job interests and location.</p></div>}
    {selection && <InformationPane selection={selection} onClose={() => setSelection(null)} />}
  </div>;
}
export default JobSeekerSearch;
