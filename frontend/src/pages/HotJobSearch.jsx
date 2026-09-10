import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { JobGroups } from '../components/SearchCards';
import InformationPane from '../components/InformationPane';

function HotJobSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [searchMode, setSearchMode] = useState('type-location');
  const [selection, setSelection] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    let data;

    if (searchMode === 'company') {
      data = {
        search_type: 'company',
        company_name: formData.get('company_name') || ''
      };
    } else {
      const jobTypes = formData.getAll('job_type');
      const otherJobType = formData.get('other_job_type');
      if (otherJobType && otherJobType.trim() !== '') {
        jobTypes.push(otherJobType.trim());
      }
      data = {
        search_type: 'type-location',
        job_types: jobTypes,
        address: formData.get('address'),
        radius: formData.get('radius')
      };
    }

    try {
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resultData = await response.json();

      if (resultData.success) {
        setResults(resultData.results);
      } else {
        alert('Search failed: ' + (resultData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error - Is your backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return <div className="workspace-page search-page advanced-search-page">
    <div className="page-heading"><div><p className="eyebrow">FIND YOUR NEXT OPPORTUNITY</p><h1>Job Search</h1><p>Find opportunities by company, job type, and location.</p></div><Link className="subtle-button" to="/search"><Search size={16} />Universal search</Link></div>
    <section className="surface search-filter-panel"><h2><SlidersHorizontal size={18} />Search filters</h2>
        <form onSubmit={handleSearch}>
          <div className="search-tabs filter-mode" aria-label="Search method">{[['type-location', 'Job type & location'], ['company', 'Company name']].map(([value, label]) => <button type="button" key={value} className={searchMode === value ? 'selected' : ''} aria-pressed={searchMode === value} onClick={() => { setSearchMode(value); setResults(null); }}>{label}</button>)}</div>
          {searchMode === 'company' ? (
            <div className="form-grid">
              <div className="input-group full-width">
                <label htmlFor="hotjobsearch-company_name">Company Name</label>
                <input 
                  type="text" 
                  id="hotjobsearch-company_name"
                  name="company_name" 
                  placeholder="Enter company name (e.g. Walmart, Disney)..." 
                  required 
                />
              </div>
            </div>
          ) : (
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="hotjobsearch-job_type">Job Type (Hold Ctrl/Cmd to select multiple)</label>
                <select id="hotjobsearch-job_type" name="job_type" multiple size="4">
                  <option value="HVAC Repair">HVAC Repair</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Airport (Baggage/customer service/ground ops)">Airport (Baggage/customer service/ground ops)</option>
                  <option value="Auto Parts">Auto Parts</option>
                  <option value="Car Wash Attendant">Car Wash Attendant</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Catering">Catering</option>
                  <option value="CDL Driver">CDL Driver</option>
                  <option value="Cement Mason/finisher">Cement Mason/finisher</option>
                  <option value="Computer / IT">Computer / IT</option>
                  <option value="Computer Programmer">Computer Programmer</option>
                  <option value="Construction">Construction</option>
                  <option value="Corrections">Corrections</option>
                  <option value="Custodian">Custodian</option>
                  <option value="Customer service">Customer service</option>
                  <option value="Data Entry">Data Entry</option>
                  <option value="Day Care / Preschool">Day Care/ Preschool</option>
                  <option value="Delivery Driver">Delivery Driver</option>
                  <option value="Drywaller">Drywaller</option>
                  <option value="Educator">Educator</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Event Staff">Event Staff</option>
                  <option value="Fast food">Fast food</option>
                  <option value="Gas Station Attendant">Gas Station Attendant</option>
                  <option value="Grocery Store">Grocery Store</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Hotel/Hospitality">Hotel/Hospitality</option>
                  <option value="Housekeeper">Housekeeper</option>
                  <option value="Information Technology (IT)">Information Technology (IT)</option>
                  <option value="Landscaping">Landscaping</option>
                  <option value="Manager (Department/Project)">Manager (Department/Project)</option>
                  <option value="Manager (Store/Crew)">Manager (Store/Crew)</option>
                  <option value="Mechanic">Mechanic</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Nursing">Nursing</option>
                  <option value="Painter">Painter</option>
                  <option value="Pest Control">Pest Control</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Restaurant (Cook/Waiter/Host)">Restaurant (Cook/Waiter/Host)</option>
                  <option value="Retail">Retail</option>
                  <option value="Sales">Sales</option>
                  <option value="Security">Security</option>
                  <option value="Stocking">Stocking</option>
                  <option value="Telephone/Call Center/Scheduling">Telephone/Call Center/Scheduling</option>
                  <option value="Theme Park">Theme Park</option>
                  <option value="Trucking/Transportation">Trucking/Transportation</option>
                  <option value="Warehousing/Logistics">Warehousing/Logistics</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="hotjobsearch-address">Find a job near this location (Street, City, Zipcode)</label>
                <textarea id="hotjobsearch-address" name="address" rows="4" placeholder="Enter full address..."></textarea>
              </div>

              <div className="input-group">
                <label htmlFor="hotjobsearch-other_job_type">Other Job Type (Not in list)</label>
                <input id="hotjobsearch-other_job_type" type="text" name="other_job_type" placeholder="Enter other job type..." />
              </div>

              <div className="input-group">
                <label htmlFor="hotjobsearch-radius">List jobs within radius of (miles)</label>
                <input id="hotjobsearch-radius" type="number" name="radius" defaultValue="20" min="1" />
              </div>
            </div>
          )}

          <div className="filter-actions"><button type="submit" className="solid-button" disabled={loading}><Search size={17} />{loading ? 'Searching...' : 'Search jobs'}</button><span className="muted">Select a result to view opportunity details.</span></div>
        </form>
    </section>
    {loading && <p className="search-loading" role="status">Searching opportunities...</p>}
    {!loading && results && <JobGroups results={results} onSelect={setSelection} />}
    {!loading && !results && <div className="empty-state search-start"><Search size={28} /><h2>A good opportunity starts with a search</h2><p>Choose a company or use job types and a location to narrow your results.</p></div>}
    {selection && <InformationPane selection={selection} onClose={() => setSelection(null)} />}
  </div>;
}
export default HotJobSearch;
