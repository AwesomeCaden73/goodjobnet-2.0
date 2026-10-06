import { useState } from 'react';
import JobTypePicker from './JobTypePicker';
import { JOB_TYPES } from './jobTypes';

export default function EntryJobTypes({ name, initial = [], selected, onChange, label }) {
  const [values, setValues] = useState(initial);
  const current = selected ?? values;
  const change = onChange ?? setValues;
  return <div className="entry-job-types"><JobTypePicker selected={current} onChange={change} name={null} label={label} /><select name={name} multiple value={current} onChange={() => {}} hidden aria-hidden="true">{JOB_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>;
}
