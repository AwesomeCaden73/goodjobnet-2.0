import ContactActions from './ContactActions.jsx';
import { matchingJob } from './contactDetails';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Pencil, BriefcaseBusiness, Users, ArrowUpRight } from 'lucide-react';
import { distanceLabel } from './searchFormatting';

function Field({ label, children }) {
  return <div className="info-field"><dt>{label}</dt><dd>{children || 'Not provided'}</dd></div>;
}

export default function InformationPane({ selection, onClose, returnTo, canEdit = true }) {
  const dialog = useRef(null);
  const [details, setDetails] = useState(null);
  const [detailsError, setDetailsError] = useState('');
  const [tab, setTab] = useState('Overview');
  useEffect(() => {
    const trigger = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);
  const person = selection.kind === 'person';
  const record = selection.record;
  useEffect(() => {
    if (selection.kind === 'person') return;
    const controller = new AbortController();
    fetch('/api/hot-jobs-review?category=company&company=' + encodeURIComponent(selection.record.company), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => {
        if (!data.success) throw new Error();
        const match = matchingJob(data.jobs || [], selection.record);
        if (match) setDetails(match);
        else setDetailsError('Contact details could not be matched to this opportunity.');
      }).catch(error => { if (error.name !== 'AbortError') setDetailsError('Contact details are unavailable. Please try opening this opportunity again.'); });
    return () => controller.abort();
  }, [selection]);
  const address = person ? record.address || [record.street, record.city, record.zipcode].filter(Boolean).join(', ') : details ? [details.company_street, details.company_city, details.company_state, details.company_zip].filter(Boolean).join(', ') : record.location;
  const phones = person ? [record.phone, record.phone2, record.secondary_phone, record.mobile_phone, record.home_phone] : [details?.contact_phone];
  const email = person ? record.email : details?.contact_email;
  const tabs = person ? ['Overview', 'Contact', 'Employment & support'] : ['Overview', 'Notes'];
  const contact = <section className="info-section"><h2>Contact information</h2><dl className="info-grid"><Field label="Email">{record.email && <a href={`mailto:${record.email}`}>{record.email}</a>}</Field><Field label="Phone">{record.phone && <a href={`tel:${record.phone}`}>{record.phone}</a>}</Field><Field label="Address">{record.address || [record.street, record.city, record.zipcode].filter(Boolean).join(', ')}</Field><Field label="Ward">{record.ward}</Field><Field label="Stake">{record.stake}</Field><Field label="Distance">{distanceLabel(record.distance)}</Field></dl></section>;
  const support = <section className="info-section"><h2>Employment & support</h2><dl className="info-grid"><Field label="Job interests">{record.desired_job_types || record.job_types}</Field><Field label="Job needed">{record.job_needed}</Field><Field label="Skills & education">{record.skills_education}</Field><Field label="Matching jobs">{String(record.matching_jobs_count ?? 0)}</Field></dl><h3>Requested assistance</h3><div className="support-tags">{[['resume_assistance', 'Résumé assistance'], ['interview_coaching', 'Interview coaching'], ['job_search_assistance', 'Job search assistance']].filter(([key]) => record[key] === true).map(([key, label]) => <span className="status-badge" key={key}>{label}</span>)}{!record.resume_assistance && !record.interview_coaching && !record.job_search_assistance && <p>No assistance requested.</p>}</div><h3>General notes</h3><p className="info-notes">{record.general_notes || 'No notes provided.'}</p></section>;
  return <dialog ref={dialog} className="information-pane" aria-labelledby="info-pane-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="information-pane-inner"><button type="button" className="icon-button info-close" aria-label="Close information pane" autoFocus onClick={onClose}><X size={21} /></button>
      <header className="info-header"><span className={'info-avatar app-icon ' + (person ? 'teal' : 'blue')}>{person ? <Users size={36} /> : <BriefcaseBusiness size={36} />}</span><div><p className="eyebrow">{person ? 'JOB SEEKER' : 'JOB OPPORTUNITY'}</p><h1 id="info-pane-title">{person ? record.name : record.company}</h1><p>{person ? record.city || 'Job seeker profile' : record.role}</p><div className="info-actions">{!person && /^https?:\/\//i.test(record.career_website || '') && <a className="solid-button" href={record.career_website} target="_blank" rel="noreferrer">View posting<ArrowUpRight size={16} /></a>}<ContactActions phone={phones} email={email} address={address} />{person ? <Link className="subtle-button" to="/job-seeker-entry" state={{ seeker: record, fromSearch: true, ...(returnTo ? { fromUniversal: returnTo } : {}) }}><Pencil size={16} />Edit</Link> : canEdit && details && <Link className="subtle-button" to={'/hot-jobs-review?category=company&company=' + encodeURIComponent(record.company)} state={{ editJob: details, returnTo: returnTo || '/hot-job-search' }}><Pencil size={16} />Edit</Link>}</div>{!person && detailsError && <p className="muted" role="status">{detailsError}</p>}{!person && !details && !detailsError && <p className="muted" role="status">Loading contact details...</p>}</div></header>
      <div className="search-tabs info-tabs" role="tablist" aria-label="Information sections">{tabs.map(label => <button type="button" role="tab" id={'info-tab-' + tabs.indexOf(label)} aria-controls="info-content" aria-selected={tab === label} tabIndex={tab === label ? 0 : -1} key={label} className={tab === label ? 'selected' : ''} onClick={() => setTab(label)} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const index = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (tabs.indexOf(label) + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; setTab(tabs[index]); e.currentTarget.parentElement.children[index].focus(); } }}>{label}</button>)}</div>
      <div className="info-content" id="info-content" role="tabpanel" aria-labelledby={'info-tab-' + tabs.indexOf(tab)} tabIndex={0}>
        {person ? <>{(tab === 'Overview' || tab === 'Contact') && contact}{(tab === 'Overview' || tab === 'Employment & support') && support}</> : <>{tab === 'Overview' && <section className="info-section"><h2>Opportunity information</h2><dl className="info-grid"><Field label="Hiring contact">{details?.contact_name}</Field><Field label="Phone">{details?.contact_phone}</Field><Field label="Email">{details?.contact_email}</Field><Field label="Role">{record.role}</Field><Field label="Hiring status">{record.hiring ? 'Currently hiring' : 'Not currently hiring'}</Field><Field label="Location">{record.location}</Field><Field label="Distance">{distanceLabel(record.distance)}</Field><Field label="Last verified">{record.date_verified}</Field><Field label="Career website">{/^https?:\/\//i.test(record.career_website || '') ? <a href={record.career_website} target="_blank" rel="noreferrer">{record.career_website}</a> : record.career_website}</Field></dl></section>}<section className="info-section"><h2>Notes</h2><p className="info-notes">{record.notes || 'No notes provided.'}</p></section></>}
      </div>
    </div>
  </dialog>;
}
