// Anonymous usage statistics, sent to our own Umami server (stats.topgradeedu.com).
// No cookies, no names or contact details; Umami does not store IP addresses.
// Everything here is best effort: when the tracker is blocked, offline or not loaded (local
// testing; index.html limits it to app.topgradeedu.com), events are silently dropped.

const queue = [];
let flushing = false;

function tracker() {
  return typeof window !== 'undefined' && window.umami && typeof window.umami.track === 'function' ? window.umami : null;
}

function flush() {
  const t = tracker();
  if (!t || flushing) return;
  flushing = true;
  try {
    while (queue.length) {
      const [kind, a, b] = queue.shift();
      if (kind === 'event') t.track(a, b);
      else if (kind === 'identify' && typeof t.identify === 'function') t.identify(a);
    }
  } catch {
    queue.length = 0; // a broken tracker must never affect the app
  } finally {
    flushing = false;
  }
}

// The tracker script loads with `defer`; events raised before it is ready wait in a short queue.
if (typeof document !== 'undefined') {
  document.querySelector('script[data-website-id]')?.addEventListener('load', flush);
}

function enqueue(item) {
  if (queue.length < 300) queue.push(item);
  flush();
}

/** Records an event, e.g. track('quiz_start', { topic: 'problem-solving/topic-1', mode: 'exam' }). */
export const track = (name, data) => enqueue(['event', name, data]);

/** Describes the session (interface language, theme, installed app or browser). */
export const describeSession = (data) => enqueue(['identify', data]);
