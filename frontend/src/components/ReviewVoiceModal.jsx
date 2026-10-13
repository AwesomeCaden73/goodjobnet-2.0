import { useEffect, useRef } from 'react';
import { X, Mic, Phone, Volume2, Keyboard, CircleHelp } from 'lucide-react';

const commandGroups = [
  ['Navigate', ['Next job', 'Previous job', 'Read details']],
  ['Edit', ['Update company type', 'Update job types', 'Update currently hiring status', 'Update notes']],
  ['Actions', ['Call company', 'Pause', 'Resume', 'Save', 'Delete job', 'Help']],
];

export default function ReviewVoiceModal({ onClose, voiceActive, isVoicePaused, onToggle, callMethod, onCallMethodChange, speechStatus, micVolume, lastHeard, skipVoiceIntro, onSkipVoiceIntroChange }) {
  const dialog = useRef(null);
  useEffect(() => {
    const trigger = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);
  const status = !voiceActive ? 'Off' : isVoicePaused ? 'Paused' : 'On';
  return <dialog ref={dialog} className="review-voice-modal" aria-labelledby="review-voice-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="review-voice-modal-content">
      <header className="voice-modal-heading"><span className="app-icon purple"><Mic size={24} /></span><div><h2 id="review-voice-title">Voice assistant</h2><p>Review opportunities with your voice.</p></div><button type="button" className="icon-button" aria-label="Close voice settings" onClick={onClose} autoFocus><X size={20} /></button></header>
      <section className="voice-control-card">
        <div className="voice-control-row"><div><h3>Voice controls <span className={'voice-state ' + (voiceActive ? 'enabled' : '')}>{status}</span></h3><p>{voiceActive ? 'Turn off voice controls when you finish reviewing.' : 'Turn on your microphone to use spoken commands.'}</p></div><button type="button" className={voiceActive ? 'subtle-button' : 'solid-button'} onClick={onToggle}><Mic size={16} />{voiceActive ? 'Turn off' : 'Turn on'}</button></div>
        <div className="voice-feedback"><span className={'voice-status-indicator ' + (voiceActive ? 'enabled' : '')} /><span role="status">{speechStatus}</span><kbd>V</kbd></div>
        <div className="voice-meter-row"><span>Microphone level</span><meter min="0" max="100" value={voiceActive ? micVolume : 0} aria-label="Microphone level" /><span>{voiceActive ? micVolume : 0}%</span></div>
        {voiceActive && <p className="voice-last-heard"><span>Last heard</span>{lastHeard || 'Waiting for a command...'}</p>}
      </section>
      <label className="voice-intro-toggle"><div><strong>Skip activation instructions</strong><span>Only say "Voice assistant activated" before reading the opportunity.</span></div><input type="checkbox" role="switch" aria-label="Skip activation instructions" checked={skipVoiceIntro} onChange={event => onSkipVoiceIntroChange(event.target.checked)} /></label>
      <section className="voice-call-settings"><h3><Phone size={16} />Calling preference</h3><label htmlFor="voice-call-method">When you say "Call company"</label><select id="voice-call-method" value={callMethod} onChange={event => onCallMethodChange(event.target.value)}><option value="google-voice">Google Voice</option><option value="phone-link">Phone Link</option><option value="speak-only">Read phone number aloud</option></select><p>While voice controls are on, the Call button uses this preference. When off, it opens your default phone app.</p></section>
      <section className="voice-command-guide"><h3><Volume2 size={16} />What you can say</h3><div className="voice-command-groups">{commandGroups.map(([title, commands]) => <div key={title}><h4>{title}</h4><div>{commands.map(command => <span key={command}>{command}</span>)}</div></div>)}</div><p>The Save command updates the entry. Review your changes before using it.</p></section>
      <details className="voice-mic-help"><summary><CircleHelp size={16} />Microphone not responding?</summary><p>Allow microphone access in your browser's site settings, then check that the correct microphone is selected. The level meter should move when you speak.</p></details>
      <footer className="voice-modal-footer"><span><Keyboard size={16} />Press V to toggle voice controls</span><button type="button" className="subtle-button" onClick={onClose}>Done</button></footer>
    </div>
  </dialog>;
}
