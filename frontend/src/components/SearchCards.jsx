import { useState } from 'react';
import { BriefcaseBusiness, Users, MapPin, ChevronRight } from 'lucide-react';

import { distanceLabel, verificationDate } from './searchFormatting';

export function JobCard({ job, onSelect }) {
  return <button type="button" className="surface job-result selectable-result" onClick={() => onSelect({ kind: 'job', record: job })} aria-label={`View job: ${job.company}, ${job.role}`}>
    <span className="app-icon blue"><BriefcaseBusiness size={25} /></span>
    <span className="result-body"><span className="result-title"><strong className="result-name">{job.company || 'Company not listed'}</strong><span className={'status-badge ' + (job.hiring ? 'hiring' : '')}>{job.hiring ? 'Currently hiring' : 'Not currently hiring'}</span></span>
      <span className="result-role">{job.role || 'Role not listed'}</span><span className="result-meta"><MapPin size={13} />{job.location || 'Location not listed'}{typeof job.distance === 'number' && ` · ${distanceLabel(job.distance)}`}</span><span className="muted">Verified: {verificationDate(job.date_verified)}</span></span>
    <ChevronRight size={18} className="result-chevron" />
  </button>;
}

export function PersonCard({ person, onSelect }) {
  return <button type="button" className="surface person-result selectable-result" onClick={() => onSelect({ kind: 'person', record: person })} aria-label={`View job seeker: ${person.name}`}>
    <span className="app-icon teal"><Users size={23} /></span><span className="result-body"><strong className="result-name">{person.name}</strong><span className="person-interests">{person.desired_job_types || person.job_types || 'Job interests not listed'}</span><span className="result-meta"><MapPin size={13} />{person.address || person.city || 'Location not listed'}{typeof person.distance === 'number' && ` · ${distanceLabel(person.distance)}`}</span><span className="muted">{person.matching_jobs_count ?? 0} matching jobs</span></span><ChevronRight size={18} className="result-chevron" />
  </button>;
}

function JobGroup({ items = [], title, hiring, onSelect }) {
  const [page, setPage] = useState({ items, limit: 25 });
  const limit = page.items === items ? page.limit : 25;
  return <section className="result-section"><h2>{title} <span className="muted">{items.length}</span></h2>
    {items.length ? <><div className="search-result-list">{items.slice(0, limit).map((job, i) => <JobCard key={i} job={{ ...job, hiring }} onSelect={onSelect} />)}</div>
      <p className="muted" role="status">Showing {Math.min(limit, items.length)} of {items.length} opportunities</p>
      {limit < items.length && <button type="button" className="subtle-button" onClick={() => setPage({ items, limit: limit + 25 })}>Show more {hiring ? 'currently hiring' : 'other'} opportunities</button>}</>
      : <p className="empty-state">{hiring ? 'No currently hiring jobs match these filters.' : 'No other matching opportunities.'}</p>}
  </section>;
}

export function JobGroups({ results, onSelect }) {
  return <><JobGroup items={results.recent} title="Currently hiring" hiring onSelect={onSelect} /><JobGroup items={results.older} title="Other matching opportunities" hiring={false} onSelect={onSelect} /></>;
}
