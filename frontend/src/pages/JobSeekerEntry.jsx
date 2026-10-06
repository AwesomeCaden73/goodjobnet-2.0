import EntryJobTypes from '../components/EntryJobTypes';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const standardOptions = [
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

function JobSeekerEntry({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const seeker = location.state?.seeker;
  const fromSearch = location.state?.fromSearch;
  const fromAssigned = location.state?.fromAssigned;

  const seekerTypes = seeker?.desired_job_types ? seeker.desired_job_types.split(',').map(t => t.trim()) : [];
  const standardSelected = seekerTypes.filter(t => standardOptions.includes(t));
  const customSelected = seekerTypes.filter(t => !standardOptions.includes(t)).join(', ');

  const [selectedJobTypes, setSelectedJobTypes] = useState(standardSelected);

  const [matchingJobs, setMatchingJobs] = useState({ recent: [], older: [] });
  const [matchingJobsLoading, setMatchingJobsLoading] = useState(false);

  useEffect(() => {
    const loadMatchingJobs = async () => {
      if (!seeker) return;
      setMatchingJobsLoading(true);
      try {
        const response = await fetch(`/api/seeker-matching-jobs?row_index=${seeker.row_index}&job_types=${encodeURIComponent(seeker.desired_job_types || seeker.job_types || '')}&zipcode=${encodeURIComponent(seeker.zipcode || '')}`);
        const data = await response.json();
        if (data.success) {
          setMatchingJobs(data.results);
        } else {
          console.error("Failed to load matching jobs:", data.error);
        }
      } catch (err) {
        console.error("Error loading matching jobs:", err);
      } finally {
        setMatchingJobsLoading(false);
      }
    };

    loadMatchingJobs();
  }, [seeker]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Handle multiple selections for desired_job_types
    const desired_job_types = Array.from(e.target.querySelectorAll('select[name="desired_job_types"] option:checked')).map(el => el.value);
    const otherJobType = formData.get('other_job_type');
    if (otherJobType && otherJobType.trim() !== '') {
      desired_job_types.push(otherJobType.trim());
    }
    data.desired_job_types = desired_job_types;

    // Handle checkboxes
    data.resume_assistance = formData.get('resume_assistance') === 'on';
    data.interview_coaching = formData.get('interview_coaching') === 'on';
    data.job_search_assistance = formData.get('job_search_assistance') === 'on';

    if (user) {
      data.submitter_name = user.name;
      data.submitter_ward = user.ward;
      data.submitter_stake = user.stake;
      data.submitter_phone = user.phone;
      data.submitter_email = user.email;
    }

    try {
      const endpoint = (fromSearch || fromAssigned) ? '/api/update-seeker' : '/api/submit-seeker';
      if ((fromSearch || fromAssigned) && seeker?.row_index) {
        data.row_index = seeker.row_index;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setMessage((fromSearch || fromAssigned) ? 'Job Seeker successfully updated!' : 'Job Seeker successfully added!');
        
        if (fromSearch) {
          // Update the sessionStorage cache so the report has the updated seeker data
          try {
            const savedResultsStr = sessionStorage.getItem('seeker_search_results');
            if (savedResultsStr) {
              const savedResults = JSON.parse(savedResultsStr);
              const updateSeekerInList = (list) => {
                if (!list) return list;
                return list.map(s => {
                  if (s.row_index === seeker.row_index) {
                    return {
                      ...s,
                      name: data.name,
                      street: data.street,
                      city: data.city,
                      zipcode: data.zipcode,
                      ward: data.ward,
                      stake: data.stake,
                      phone: data.phone,
                      email: data.email,
                      skills_education: data.skills_education,
                      job_needed: data.job_needed,
                      desired_job_types: data.desired_job_types.join(', '),
                      general_notes: data.general_notes,
                      resume_assistance: data.resume_assistance,
                      interview_coaching: data.interview_coaching,
                      job_search_assistance: data.job_search_assistance,
                      address: [data.street, data.city, data.zipcode].filter(Boolean).join(', ')
                    };
                  }
                  return s;
                });
              };
              if (savedResults.nearby) savedResults.nearby = updateSeekerInList(savedResults.nearby);
              if (savedResults.other) savedResults.other = updateSeekerInList(savedResults.other);
              sessionStorage.setItem('seeker_search_results', JSON.stringify(savedResults));
            }
          } catch (cacheErr) {
            console.error('Failed to update search results cache:', cacheErr);
          }
        } else {
          e.target.reset();
        }
      } else {
        setSuccess(false);
        setMessage(result.error || 'Failed to submit');
      }
    } catch (err) {
      setSuccess(false);
      setMessage('Error connecting to server.');
    }
    setLoading(false);
  };

  return (
    <div className="app-container entry-page">
      <div className="glass-panel main-form streamlined-entry">
        <header className="entry-heading"><p className="eyebrow">CREATE A CONNECTION</p>
          <h1>{seeker ? 'Edit job seeker' : 'Job seeker'}</h1>
          <p className="subtitle">{seeker ? 'Review contact information, employment interests, and matching jobs.' : 'Enter information for an individual seeking employment'}</p>
        </header>

        <form onSubmit={handleSubmit}>
          <fieldset className="entry-section"><legend>Contact & community</legend><p>How can we reach this person?</p><div className="form-grid">
            <div className="input-group full-width">
              <label htmlFor="jobseekerentry-name">Name of Job Seeker <span className="required">*</span></label>
              <input id="jobseekerentry-name" type="text" name="name" defaultValue={seeker?.name || ''} required />
            </div>

            <div className="input-group full-width">
              <label htmlFor="jobseekerentry-street">Street Address</label>
              <input id="jobseekerentry-street" type="text" name="street" defaultValue={seeker?.street || ''} />
            </div>

            <div className="input-group">
              <label htmlFor="jobseekerentry-city">City</label>
              <input id="jobseekerentry-city" type="text" name="city" defaultValue={seeker?.city || ''} />
            </div>

            <div className="input-group">
              <label htmlFor="jobseekerentry-zipcode">Zipcode</label>
              <input id="jobseekerentry-zipcode" type="text" name="zipcode" defaultValue={seeker?.zipcode || ''} />
            </div>

            <div className="input-group">
              <label htmlFor="jobseekerentry-ward">Ward</label>
              <input id="jobseekerentry-ward" type="text" name="ward" defaultValue={seeker?.ward || ''} />
            </div>

            <div className="input-group">
              <label htmlFor="jobseekerentry-stake">Stake</label>
              <input id="jobseekerentry-stake" type="text" name="stake" defaultValue={seeker?.stake || ''} />
            </div>

            <div className="input-group">
              <label htmlFor="jobseekerentry-phone">Phone</label>
              <input id="jobseekerentry-phone" type="tel" name="phone" defaultValue={seeker?.phone || ''} />
            </div>

            <div className="input-group">
              <label htmlFor="jobseekerentry-email">Email</label>
              <input id="jobseekerentry-email" type="email" name="email" defaultValue={seeker?.email || ''} />
            </div>

          </div></fieldset><fieldset className="entry-section"><legend>Employment interests</legend><p>Experience and the opportunities they are looking for.</p><div className="form-grid">
            <div className="input-group full-width">
              <label htmlFor="jobseekerentry-skills_education">Skills/Education</label>
              <textarea id="jobseekerentry-skills_education" name="skills_education" rows="3" placeholder="Enter skills and education..." defaultValue={seeker?.skills_education || ''}></textarea>
            </div>

            <div className="input-group full-width">
              <label htmlFor="jobseekerentry-job_needed">Desired Company Type for employer</label>
              <select id="jobseekerentry-job_needed" name="job_needed" defaultValue={seeker?.job_needed || ''}>
                <option value="">Select Type...</option>
                <option value="Construction">Construction</option>
                <option value="Driving">Driving</option>
                <option value="Education">Education</option>
                <option value="Government related">Government related</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Janitorial">Janitorial</option>
                <option value="Non-Profit">Non-Profit</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Retail">Retail</option>
                <option value="Technology">Technology</option>
                <option value="Theme Park">Theme Park</option>
              </select>
            </div>

            <div className="input-group full-width">
              <EntryJobTypes name="desired_job_types" label="Desired job types" selected={selectedJobTypes} onChange={setSelectedJobTypes} />
            </div>

            <div className="input-group full-width">
              <label htmlFor="jobseekerentry-other_job_type">Other Job Type (Not in list)</label>
              <input id="jobseekerentry-other_job_type" type="text" name="other_job_type" placeholder="Enter other job type..." defaultValue={customSelected} />
            </div>

          </div></fieldset><fieldset className="entry-section"><legend>Notes & support</legend><p>Record context and requested assistance.</p><div className="form-grid">
            <div className="input-group full-width">
              <label htmlFor="jobseekerentry-general_notes">General Notes</label>
              <textarea id="jobseekerentry-general_notes" name="general_notes" rows="3" placeholder="Any additional notes..." defaultValue={seeker?.general_notes || ''}></textarea>
            </div>

            <div className="input-group full-width">
              <label>Employment Center Assistance Requested?</label>
              <div className="checkbox-group">
                <input type="checkbox" id="resume_assistance" name="resume_assistance" defaultChecked={seeker?.resume_assistance} />
                <label htmlFor="resume_assistance" style={{ margin: 0, fontWeight: 400 }}>Resume assistance</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="interview_coaching" name="interview_coaching" defaultChecked={seeker?.interview_coaching} />
                <label htmlFor="interview_coaching" style={{ margin: 0, fontWeight: 400 }}>Interview coaching</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="job_search_assistance" name="job_search_assistance" defaultChecked={seeker?.job_search_assistance} />
                <label htmlFor="job_search_assistance" style={{ margin: 0, fontWeight: 400 }}>Job Search assistance</label>
              </div>
            </div>
          </div></fieldset>

          {message && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: success ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: success ? 'var(--success)' : 'var(--error)' }}>
              {message}
            </div>
          )}

          <div className="actions entry-actions">
            <button 
              type="button" 
              className="btn secondary-btn" 
              onClick={() => {
                if (location.state?.fromUniversal) {
                  navigate(location.state.fromUniversal);
                } else if (fromAssigned) {
                  navigate('/assigned-job-seekers');
                } else if (fromSearch) {
                  navigate('/job-seeker-search', { state: { keepResults: true } });
                } else if (seeker) {
                  navigate('/job-seeker-search', { state: { keepResults: true } });
                } else {
                  navigate('/create');
                }
              }}
            >
              {(fromSearch || fromAssigned) ? 'Return to report' : 'Cancel'}
            </button>
            <button 
              type="submit" 
              className="btn primary-btn" 
              disabled={loading || (!!seeker && !(fromSearch || fromAssigned))}
            >
              {loading ? 'Submitting...' : ((fromSearch || fromAssigned) ? 'Submit changes' : 'Submit Job Seeker')}
            </button>
          </div>
        </form>

        {seeker && (
          <div className="matching-jobs-section mt-3" style={{ borderTop: '2px solid rgba(0,0,0,0.1)', paddingTop: '2rem', marginTop: '2rem' }}>
            <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Matching Jobs for {seeker.name}</h2>
            <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Based on desired job types: <strong>{seeker.desired_job_types || seeker.job_types}</strong>
            </p>
            {matchingJobsLoading ? (
              <p className="text-center">Loading matching jobs from JobBank...</p>
            ) : (
              <>
                <h3 style={{ marginTop: '1.5rem', color: 'var(--success)', borderBottom: '2px solid #2ecc71', paddingBottom: '0.4rem', marginBottom: '0.8rem' }}>
                  Currently Hiring Jobs ({matchingJobs.recent.length})
                </h3>
                {matchingJobs.recent.length > 0 ? (
                  <div className="table-container mb-2">
                    <table>
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Role</th>
                          <th>Location</th>
                          <th>Distance</th>
                          <th>Career Website</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchingJobs.recent.map((job, idx) => (
                          <tr key={idx}>
                            <td>
                              <Link 
                                to={`/hot-jobs-review?category=company&company=${encodeURIComponent(job.company)}`} 
                                state={{ seeker, fromEntry: true, fromAssigned, fromSearch }}
                                style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}
                              >
                                {job.company}
                              </Link>
                            </td>
                            <td>{job.role}</td>
                            <td>{job.location}</td>
                            <td>{job.distance || 'N/A'}</td>
                            <td>
                              {job.career_website ? (
                                <a href={job.career_website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>
                                  View Posting
                                </a>
                              ) : 'N/A'}
                            </td>
                            <td>{job.notes || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginBottom: '1.5rem' }}>No currently hiring jobs found matching criteria.</p>}

                <h3 style={{ marginTop: '2rem', color: 'var(--warning)', borderBottom: '2px solid #f39c12', paddingBottom: '0.4rem', marginBottom: '0.8rem' }}>
                  Other Jobs Meeting Criteria (Not Currently Hiring) ({matchingJobs.older.length})
                </h3>
                {matchingJobs.older.length > 0 ? (
                  <div className="table-container mb-2">
                    <table>
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Role</th>
                          <th>Location</th>
                          <th>Distance</th>
                          <th>Career Website</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchingJobs.older.map((job, idx) => (
                          <tr key={idx}>
                            <td>
                              <Link 
                                to={`/hot-jobs-review?category=company&company=${encodeURIComponent(job.company)}`} 
                                state={{ seeker, fromEntry: true, fromAssigned, fromSearch }}
                                style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}
                              >
                                {job.company}
                              </Link>
                            </td>
                            <td>{job.role}</td>
                            <td>{job.location}</td>
                            <td>{job.distance || 'N/A'}</td>
                            <td>
                              {job.career_website ? (
                                <a href={job.career_website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>
                                  View Posting
                                </a>
                              ) : 'N/A'}
                            </td>
                            <td>{job.notes || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p style={{ fontStyle: 'italic', color: 'var(--text-light)' }}>No other matching jobs found.</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JobSeekerEntry;
