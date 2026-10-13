import { useEffect, useRef, useState } from 'react';

// Guard common exits without altering the router or the server's save behavior.
export default function useUnsavedChanges() {
  const dirty = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const setDirty = value => { dirty.current = value; setIsDirty(value); };
  const markDirty = () => setDirty(true);
  const markSaved = () => setDirty(false);
  const confirmDiscard = () => {
    if (!dirty.current) return true;
    if (!window.confirm('Discard your unsaved changes?')) return false;
    markSaved();
    return true;
  };
  useEffect(() => {
    const unload = event => {
      if (dirty.current) { event.preventDefault(); event.returnValue = ''; }
    };
    const leave = event => {
      const anchor = event.target.closest?.('a[href]');
      if (!dirty.current || !anchor || anchor.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
      if (!window.confirm('Discard your unsaved changes?')) {
        event.preventDefault(); event.stopPropagation();
      } else markSaved();
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', leave, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true); };
  }, []);
  const formProps = {
    onChangeCapture: markDirty,
    onClickCapture: event => {
      if (event.target.closest?.('.selected-job-types button, .job-type-footer .text-link')) markDirty();
    },
  };
  return { formProps, markSaved, markDirty, setDirty, isDirty, confirmDiscard };
}
