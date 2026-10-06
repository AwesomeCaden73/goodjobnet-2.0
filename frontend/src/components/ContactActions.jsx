import { useState } from 'react';
import { Phone, MessageSquare, Mail, Navigation, ChevronDown } from 'lucide-react';
import { phoneNumbers } from './contactDetails';

export default function ContactActions({ phone, email, address }) {
  const numbers = phoneNumbers(...(Array.isArray(phone) ? phone : [phone]));
  const [picker, setPicker] = useState(null);
  return <>{numbers.length > 0 && ['Call', 'Text'].map(action => {
    const Icon = action === 'Call' ? Phone : MessageSquare;
    const buttonClass = action === 'Call' ? 'solid-button' : 'subtle-button';
    const scheme = action === 'Call' ? 'tel:' : 'sms:';
    return numbers.length === 1 ? <a className={buttonClass} key={action} href={scheme + numbers[0].number}><Icon size={16} />{action}</a> : <div className="contact-action-picker" key={action}><button type="button" className={buttonClass} aria-expanded={picker === action} onClick={() => setPicker(picker === action ? null : action)}><Icon size={16} />{action}<ChevronDown size={14} /></button>{picker === action && <div className="contact-number-options" aria-label={`Choose a number to ${action.toLowerCase()}`}><p>Choose a phone number</p>{numbers.map(({ label, number }) => <a key={number} href={scheme + number} onClick={() => setPicker(null)}>{label}</a>)}<button type="button" className="text-link" onClick={() => setPicker(null)}>Cancel</button></div>}</div>;
  })}{email && /\S+@\S+\.\S+/.test(email) && <a className="subtle-button" href={'mailto:' + email}><Mail size={16} />Email</a>}{address && <a className="subtle-button" href={'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(address)} target="_blank" rel="noreferrer"><Navigation size={16} />Navigate</a>}</>;
}
