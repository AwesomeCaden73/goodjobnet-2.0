import { useState } from 'react';
import { Phone, Mic, Plus, X } from 'lucide-react';
import { phoneNumbers } from './contactDetails';
import { fullAddress } from '../reviewAddress';

export function CurrentOpportunity({ job, voiceActive = false, onCall, onVoiceSettings, onJobsSave, onEditChange, busy, children }) {
  const phone = phoneNumbers(job.contact_phone)[0]?.number;
  const positions = (job.available_jobs || '').split(/[,;\n]+/).map(value => value.trim()).filter(Boolean);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(positions);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const displayed = editing ? draft : positions;
  const changed = values => values.join(', ') !== positions.join(', ');
  const notify = (values, input = '') => onEditChange?.(changed(values) || !!input.trim(), true);
  const add = () => {
    const additions = text.split(',').map(value => value.trim()).filter(Boolean);
    const next = [...draft, ...additions];
    setDraft(next); setText(''); setAdding(false); notify(next);
    return next;
  };
  return <section className="review-current" aria-labelledby="current-opportunity-title">
    <p className="eyebrow">CURRENT OPPORTUNITY</p>
    <h2 id="current-opportunity-title">{job.company_name || 'Unnamed opportunity'}</h2>
    <p className="review-address">{fullAddress(job) || 'No address provided'}</p>
    <div className="review-contact"><h3>Hiring contact</h3><p>{job.contact_name || 'No contact name provided'}</p><p>{job.contact_phone || 'No phone number provided'}</p><div className="review-call-actions">{!voiceActive && phone ? <a className="solid-button" href={`tel:${phone}`}><Phone size={17} />Call</a> : <button type="button" className="solid-button" onClick={onCall} disabled={!phone}><Phone size={17} />Call</button>}<button type="button" className={`subtle-button voice-assistant-button${voiceActive ? ' voice-assistant-active' : ''}`} onClick={onVoiceSettings} aria-haspopup="dialog" aria-label={voiceActive ? 'Voice Assistant, active' : 'Voice Assistant'}><Mic size={17} />Voice Assistant</button></div></div>
    <div><h3>Currently open positions</h3>
      <ul className="review-positions">{displayed.map((position, index) => <li key={index}>{position}{editing && <button type="button" className="position-delete" aria-label={`Remove ${position}`} onClick={() => { const next = draft.filter((_, i) => i !== index); setDraft(next); notify(next, text); }}><X size={12} /></button>}</li>)}
      {editing && <li className="position-add">{adding ? <input autoFocus aria-label="New job" value={text} placeholder="Job title" onChange={event => { setText(event.target.value); notify(draft, event.target.value); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(); } if (event.key === 'Escape') { event.stopPropagation(); setAdding(false); setText(''); notify(draft); } }} onBlur={() => { if (text.trim()) add(); }} /> : <button type="button" aria-label="Add job" onClick={() => setAdding(true)}><Plus size={18} /></button>}</li>}
      </ul>
      {!displayed.length && !editing && <p className="muted">No positions listed.</p>}
      <div className="position-edit-actions">{editing ? <><button type="button" className="subtle-button" onClick={() => { setEditing(false); setDraft(positions); setText(''); setAdding(false); onEditChange?.(false, false); }}>Discard</button><button type="button" className="solid-button" onClick={() => { const values = text.trim() ? add() : draft; onJobsSave?.(values.join(', ')); setEditing(false); onEditChange?.(false, false); }}>Save</button></> : <button type="button" className="subtle-button" disabled={busy} onClick={() => { setDraft(positions); setEditing(true); onEditChange?.(false, true); }}>Add/Edit Jobs</button>}</div>
    </div>
    {children}
  </section>;
}

export function OpportunityFields({ job }) {
  return <>
    <h2 id="opportunity-details-title">Details</h2>
    <div className="review-field-grid">
      <div className="input-group"><label htmlFor="review-company_name">Company Name</label><input id="review-company_name" name="company_name" defaultValue={job.company_name || ''} required /></div>
      <div className="input-group"><label htmlFor="review-company_type">Company Type</label><input id="review-company_type" name="company_type" defaultValue={job.company_type || ''} /></div>
      <div className="input-group full-width"><label htmlFor="review-full_address">Full address</label><input id="review-full_address" name="full_address" defaultValue={fullAddress(job)} placeholder="123 Main St, Orlando, FL 32801" aria-describedby="review-address-format" /><small id="review-address-format" className="muted">Street, City, ST ZIP</small></div>
      <div className="input-group full-width"><label htmlFor="review-career_website">Company Career Site URL</label><input id="review-career_website" name="career_website" defaultValue={job.career_website || ''} placeholder="https://" /></div>
    </div>
    <h3>Hiring Contact Information</h3>
    <div className="review-field-grid">
      <div className="input-group full-width"><label htmlFor="review-contact_name">Name</label><input id="review-contact_name" name="contact_name" defaultValue={job.contact_name || ''} /></div>
      <div className="input-group"><label htmlFor="review-contact_phone">Phone number</label><input id="review-contact_phone" name="contact_phone" type="tel" defaultValue={job.contact_phone || ''} /></div>
      <div className="input-group"><label htmlFor="review-contact_email">Email</label><input id="review-contact_email" name="contact_email" type="email" defaultValue={job.contact_email || ''} /></div>
      <div className="input-group full-width"><label htmlFor="review-notes">Additional notes</label><textarea id="review-notes" name="notes" rows="2" defaultValue={job.notes || ''} /></div>
    </div>
  </>;
}
