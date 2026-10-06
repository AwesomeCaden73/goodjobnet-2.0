export default function ZipOnlyToggle({ checked, onChange, id }) {
  return <label className="zip-only-control" htmlFor={id}><input id={id} type="checkbox" role="switch" checked={checked} onChange={e => onChange(e.target.checked)} /><span className="theme-switch" aria-hidden="true" /><span>Entered ZIP code only</span></label>;
}
