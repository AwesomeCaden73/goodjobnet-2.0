import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { JOB_TYPES } from './jobTypes';

export default function JobTypePicker({ selected, onChange, name = "job_type", label = "Job types" }) {
  const [query, setQuery] = useState('');
  const details = useRef(null);
  useEffect(() => {
    const outside = e => { if (!details.current?.contains(e.target)) details.current.open = false; };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  const options = JOB_TYPES.filter(type => type.toLowerCase().includes(query.toLowerCase()));
  return <div className="input-group job-type-field"><span id="job-type-label" className="field-label">{label}</span><details ref={details} className="job-type-picker" onToggle={e => { if (!e.currentTarget.open) setQuery(''); }} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); details.current.open = false; details.current.querySelector('summary').focus(); } }}>
    <summary aria-labelledby="job-type-label job-type-summary"><span id="job-type-summary">{selected.length ? `${selected.length} selected` : 'Any job type'}</span><ChevronDown size={17} /></summary>
    <div className="job-type-dropdown"><div className="job-type-search"><Search size={16} /><input aria-label="Filter job types" placeholder="Find a job type" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="job-type-options" role="group" aria-label="Select job types">{options.map(type => <label key={type}><input type="checkbox" checked={selected.includes(type)} onChange={e => onChange(e.target.checked ? [...selected, type] : selected.filter(value => value !== type))} /><span>{type}</span></label>)}{!options.length && <p>No job types match. Use the additional job type field below.</p>}</div><div className="job-type-footer"><button type="button" className="text-link" onClick={() => onChange([])}>Clear selection</button><button type="button" className="subtle-button" onClick={() => { details.current.open = false; details.current.querySelector('summary').focus(); }}>Done</button></div></div>
  </details>{selected.map(type => <input key={type} type="hidden" name={name} value={type} />)}{selected.length > 0 && <div className="selected-job-types">{selected.map(type => <button key={type} type="button" onClick={() => onChange(selected.filter(value => value !== type))} aria-label={`Remove ${type}`}><span>{type}</span><X size={12} /></button>)}</div>}</div>;
}
