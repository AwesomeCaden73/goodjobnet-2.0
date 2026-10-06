import EntryJobTypes from '../components/EntryJobTypes';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function JobEntry({ user }) {
  const [formKey, setFormKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    let careerWebsite = data.career_website ? data.career_website.trim() : '';
    if (careerWebsite) {
      if (!/^https?:\/\//i.test(careerWebsite)) {
        careerWebsite = 'https://' + careerWebsite;
      }
      data.career_website = careerWebsite;
    }

    const selectedJobs = formData.getAll('available_jobs_select');
    const manualJobs = data.available_jobs_manual;

    let allJobs = [...selectedJobs];
    if (manualJobs && manualJobs.trim() !== '') {
      allJobs.push(manualJobs.trim());
    }
    data.available_jobs = allJobs.join(', ');

    delete data.available_jobs_select;
    delete data.available_jobs_manual;

    if (user) {
      data.submitter_name = user.name;
      data.submitter_ward = user.ward;
      data.submitter_stake = user.stake;
      data.submitter_phone = user.phone;
      data.submitter_email = user.email;
    }

    try {
      const response = await fetch('/api/submit-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setMessage('Job successfully added to database!');
        e.target.reset();
        setFormKey(key => key + 1);
      } else {
        setSuccess(false);
        setMessage(result.error || 'Failed to submit Job.');
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
          <h1>Job opportunity</h1>
          <p className="subtitle">Submit new potential jobs to the Orlando Employment Center</p>
        </header>

        <form key={formKey} onSubmit={handleSubmit}>
          <fieldset className="entry-section"><legend>Company & location</legend><p>Where is this opportunity based?</p><div className="form-grid">

            <div className="input-group">
              <label htmlFor="jobentry-company_name">Company Name <span className="required">*</span></label>
              <input id="jobentry-company_name" type="text" name="company_name" required />
            </div>

            <div className="input-group">
              <label htmlFor="jobentry-company_type">Company Type</label>
              <input id="jobentry-company_type" type="text" name="company_type" list="company-types" placeholder="Enter or select type..." />
              <datalist id="company-types">
                <option value="Call Center" />
                <option value="Construction" />
                <option value="Driving" />
                <option value="Education" />
                <option value="Fast Food" />
                <option value="Government related" />
                <option value="Healthcare" />
                <option value="Hospitality" />
                <option value="Janitorial" />
                <option value="Non-Profit" />
                <option value="Restaurant" />
                <option value="Retail" />
                <option value="Services" />
                <option value="Technology" />
                <option value="Theme Park" />
                <option value="Vocation careers (HVAC, plumbing, electrical, etc)" />
              </datalist>
            </div>

            <div className="input-group full-width">
              <label htmlFor="jobentry-company_street">Company Street Address <span className="required">*</span></label>
              <input id="jobentry-company_street" type="text" name="company_street" required />
            </div>

            <div className="input-group">
              <label htmlFor="jobentry-company_city">City <span className="required">*</span></label>
              <input id="jobentry-company_city" type="text" name="company_city" required />
            </div>

            <div className="input-group">
              <label htmlFor="jobentry-company_state">Company State <span className="required">*</span></label>
              <select id="jobentry-company_state" name="company_state" required>
                <option value="">Select State...</option>
                <option value="FL">Florida</option>
                {/* Simplified for demo, add all states as needed */}
                <option value="AL">Alabama</option>
                <option value="GA">Georgia</option>
                <option value="TX">Texas</option>
                <option value="NY">New York</option>
                <option value="CA">California</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="jobentry-company_zip">Company Zipcode <span className="required">*</span></label>
              <input id="jobentry-company_zip" type="text" name="company_zip" required />
            </div>



          </div></fieldset><fieldset className="entry-section"><legend>Hiring contact & opportunities</legend><p>Contact details and available roles.</p><div className="form-grid">
            <div className="input-group">
              <label htmlFor="jobentry-career_website">Career Website URL</label>
              <input id="jobentry-career_website" type="text" name="career_website" />
            </div>

            <div className="input-group">
              <label htmlFor="jobentry-contact_name">Hiring Contact Name</label>
              <input id="jobentry-contact_name" type="text" name="contact_name" />
            </div>

            <div className="input-group">
              <label htmlFor="jobentry-contact_phone">Hiring Contact Phone</label>
              <input id="jobentry-contact_phone" type="tel" name="contact_phone" />
            </div>

            <div className="input-group">
              <label htmlFor="jobentry-contact_email">Hiring Contact Email</label>
              <input id="jobentry-contact_email" type="email" name="contact_email" />
            </div>



            <div className="input-group">
              <label htmlFor="jobentry-currently_hiring">Currently Hiring <span className="required">*</span></label>
              <select id="jobentry-currently_hiring" name="currently_hiring" required defaultValue="Yes">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="input-group full-width">
              <EntryJobTypes name="available_jobs_select" label="Available job types" />
              <input type="text" name="available_jobs_manual" placeholder="Other available jobs (comma separated)" style={{ marginTop: '0.5rem' }} />
            </div>

            <div className="input-group full-width">
              <label htmlFor="jobentry-notes">Additional Notes</label>
              <textarea id="jobentry-notes" name="notes" rows="2"></textarea>
            </div>

          </div></fieldset>

          {message && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: success ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: success ? 'var(--success)' : 'var(--error)' }}>
              {message}
            </div>
          )}

          <div className="actions entry-actions">
            <button type="button" className="btn secondary-btn" onClick={() => navigate('/create')}>Cancel</button>
            <button type="submit" className="btn primary-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobEntry;
