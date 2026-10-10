// Notifications ("push"): a student follows a course with the bell on its page (or from the invitation after a
// quiz) and gets a notification when the owner announces something for that course. The browser asks for
// permission only after the student taps (iPhone requires it, and asking out of the blue gets refused).
// The server keeps only the browser's push address and the followed courses: see server/push/server.mjs.

import { currentPlatform } from './install.js';
import { lang } from './i18n.js';
import { track } from './analytics.js';

const COURSES_KEY = 'topgrade.push.courses';
const INVITED_KEY = 'topgrade.push.invited';
const API = new URL('api/push/', document.baseURI).href;

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the server still knows the subscription */
  }
};

/**
 * What this device can do:
 * - 'ready'    notifications work here
 * - 'install'  iPhone/iPad in the browser: only an app added to the Home Screen can receive them
 * - 'blocked'  the student (or the phone's settings) turned notifications off for this app
 * - 'none'     this browser has no notifications
 */
export function support() {
  const { ios, installed } = currentPlatform();
  if (ios && !installed) return 'install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'none';
  if (Notification.permission === 'denied') return 'blocked';
  return 'ready';
}

const followed = () => read(COURSES_KEY, []);

async function subscription() {
  if (support() !== 'ready' || Notification.permission !== 'granted') return null;
  const reg = await navigator.serviceWorker.getRegistration(document.baseURI);
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** What this device last knew (instant, for the first paint); isFollowing() then confirms with the browser. */
export const seemsFollowing = (courseId) => followed().includes(courseId) && support() === 'ready' && Notification.permission === 'granted';

/** True when this device gets this course's notifications. */
export async function isFollowing(courseId) {
  if (!followed().includes(courseId)) return false;
  return Boolean(await subscription().catch(() => null));
}

const post = (path, body) => fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then((res) => {
    if (!res.ok) throw new Error(`push ${path}: HTTP ${res.status}`);
    return res;
  });

function urlBase64ToUint8Array(base64) {
  const raw = atob((base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/**
 * Follows a course. Call from a tap: it may show the browser's permission question.
 * Resolves 'on', or why not: 'denied' (the student said no), 'install', 'blocked', 'none', 'error'.
 */
export async function follow(courseId) {
  const state = support();
  if (state !== 'ready') return state;
  try {
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission !== 'granted') {
      track('push_permission', { result: permission, course: courseId });
      return 'denied';
    }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { key } = await (await fetch(API + 'key')).json();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
    }
    const courses = [...new Set([...followed(), courseId])];
    await post('subscribe', { subscription: sub.toJSON(), courses, lang: lang() });
    write(COURSES_KEY, courses);
    track('push_follow', { course: courseId });
    return 'on';
  } catch (err) {
    console.warn(err);
    return 'error';
  }
}

/** Stops a course's notifications; with no course left, the device stops receiving notifications at all. */
export async function unfollow(courseId) {
  const courses = followed().filter((c) => c !== courseId);
  write(COURSES_KEY, courses);
  track('push_unfollow', { course: courseId });
  try {
    const sub = await subscription();
    if (!sub) return;
    if (courses.length) await post('subscribe', { subscription: sub.toJSON(), courses, lang: lang() });
    else {
      await post('unsubscribe', { endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
  } catch (err) {
    console.warn(err);
  }
}

/** The invitation after a quiz is shown once per course, and only where following can work right away. */
export async function shouldInvite(courseId) {
  if (support() !== 'ready' || read(INVITED_KEY, []).includes(courseId)) return false;
  return !(await isFollowing(courseId));
}
export const markInvited = (courseId) => write(INVITED_KEY, [...new Set([...read(INVITED_KEY, []), courseId])]);
