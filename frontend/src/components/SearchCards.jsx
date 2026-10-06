import { BriefcaseBusiness, Users, MapPin, ChevronRight } from 'lucide-react';

import { distanceLabel } from './searchFormatting';

export function JobCard({ job, onSelect }) {
  return <button type="button" className="surface job-result selectable-result" onClick={() => onSelect({ kind: 'job', record: job })} aria-label={`View job: ${job.company}, ${job.role}`}>
    <span className="app-icon blue"><BriefcaseBusiness size={25} /></span>
    <span className="result-body"><span className="result-title"><strong className="result-name">{job.company || 'Company not listed'}</strong><span className={'status-badge ' + (job.hiring ? 'hiring' : '')}>{job.hiring ? 'Currently hiring' : 'Not currently hiring'}</span></span>
      <span className="result-role">{job.role || 'Role not listed'}</span><span className="result-meta"><MapPin size={13} />{job.location || 'Location not listed'}{job.distance != null && job.distance !== '' && ` · ${distanceLabel(job.distance)}`}</span><span className="muted">Verified: {job.date_verified || 'Not available'}</span></span>
    <ChevronRight size={18} className="result-chevron" />
  </button>;
}

export function PersonCard({ person, onSelect }) {
  return <button type="button" className="surface person-result selectable-result" onClick={() => onSelect({ kind: 'person', record: person })} aria-label={`View job seeker: ${person.name}`}>
    <span className="app-icon teal"><Users size={23} /></span><span className="result-body"><strong className="result-name">{person.name}</strong><span className="person-interests">{person.desired_job_types || person.job_types || 'Job interests not listed'}</span><span className="result-meta"><MapPin size={13} />{person.address || person.city || 'Location not listed'}{person.distance != null && person.distance !== '' && ` · ${distanceLabel(person.distance)}`}</span><span className="muted">{person.matching_jobs_count ?? 0} matching jobs</span></span><ChevronRight size={18} className="result-chevron" />
  </button>;
}

export function JobGroups({ results, onSelect }) {
  return [['recent', 'Currently hiring'], ['older', 'Other matching opportunities']].map(([key, title]) => <section className="result-section" key={key}><h2>{title} <span className="muted">{results[key]?.length || 0}</span></h2>{results[key]?.length ? <div className="search-result-list">{results[key].map((job, i) => <JobCard key={i} job={{ ...job, hiring: key === 'recent' }} onSelect={onSelect} />)}</div> : <p className="empty-state">{key === 'recent' ? 'No currently hiring jobs match these filters.' : 'No other matching opportunities.'}</p>}</section>);
}
