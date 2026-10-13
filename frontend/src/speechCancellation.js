export function cancelSpeech(synthesis, utteranceRef, speakingRef) {
  const utterance = utteranceRef.current;
  // Clear identity before cancel: browsers may synchronously fire cancellation events.
  utteranceRef.current = null;
  speakingRef.current = false;
  if (utterance) { utterance.onend = null; utterance.onerror = null; }
  synthesis?.cancel();
}
