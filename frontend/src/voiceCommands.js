export function voiceControlCommand(transcript) {
  const words = String(transcript || '').toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^(please )?(pause( voice( assistant)?)?|stop listening)( please)?$/.test(words)) return 'pause';
  if (/^(please )?(resume( voice( assistant)?)?|start listening|continue listening)( please)?$/.test(words)) return 'resume';
  return null;
}
