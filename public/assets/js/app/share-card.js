// The shared result: a square image in Smart Pro's identity (the brand gradient, the silver logo, the score ring,
// the course and the address), the way learning apps share achievements. Drawn on a canvas in the app's own font.

import { t, lang, localName } from './i18n.js';
import { topicLabel } from './catalog.js';

const SIZE = 1080;
const SITE = 'smartpro-edu.com';

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

/** Resolves a PNG blob of the result card. */
export async function resultImage({ course, topic, correct, total, percent }) {
  const dir = lang() === 'ar' ? 'rtl' : 'ltr';
  const courseName = localName(course).main;
  const topicName = topicLabel(topic, lang());
  const line = t('res.line', { c: correct, n: total });
  const sample = `${courseName}${topicName}${line}${t('share.myScore')}${SITE}0123456789%`;
  await Promise.all(['600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Cairo`, sample)));
  const logo = await loadImage('assets/img/logo-mark-share.png');

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const x = canvas.getContext('2d');
  const bg = x.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, '#0B0F0E');
  bg.addColorStop(0.58, '#11302B');
  bg.addColorStop(1, '#0A6B5D');
  x.fillStyle = bg;
  x.fillRect(0, 0, SIZE, SIZE);

  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const write = (text, y, size, weight, alpha = 1, direction = dir) => {
    x.direction = direction;
    x.font = `${weight} ${size}px Cairo, sans-serif`;
    x.fillStyle = `rgba(255,255,255,${alpha})`;
    x.fillText(text, SIZE / 2, y, SIZE - 140);
  };

  x.drawImage(logo, SIZE / 2 - 72, 64, 144, 144);
  write(t('share.myScore'), 262, 34, 600, 0.7);
  write(courseName, 322, 58, 800);
  write(topicName, 384, 38, 600, 0.78);

  const cx = SIZE / 2, cy = 618, r = 158;
  x.lineWidth = 30;
  x.lineCap = 'round';
  x.strokeStyle = 'rgba(255,255,255,0.14)';
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
  if (percent > 0) {
    x.strokeStyle = '#FFFFFF';
    x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * percent) / 100); x.stroke();
  }
  write(`${percent}%`, cy + 6, 112, 800, 1, 'ltr');
  write(line, 862, 42, 700, 0.92);

  // The address, in a pill at the bottom.
  x.direction = 'ltr';
  x.font = '700 32px Cairo, sans-serif';
  const w = x.measureText(SITE).width + 72;
  const left = (SIZE - w) / 2, top = 950, h = 66;
  x.fillStyle = 'rgba(255,255,255,0.1)';
  x.beginPath();
  if (x.roundRect) x.roundRect(left, top, w, h, h / 2); else x.rect(left, top, w, h);
  x.fill();
  write(SITE, top + h / 2 + 2, 32, 700, 0.95, 'ltr');

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
