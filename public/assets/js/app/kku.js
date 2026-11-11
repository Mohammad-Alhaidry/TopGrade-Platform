// The KKU leaks list (data/kku.json, made by tools/import-kku.mjs): the courses of the Telegram channel
// «تسريبات وتجميعات جامعة الملك خالد», by college, each with its post in the channel. Pure helpers, unit-tested.

let cached = null;

/** The list, fetched once per app start. */
export function loadKku(dataUrl) {
  cached ??= fetch(new URL('kku.json', dataUrl)).then((r) => {
    if (!r.ok) throw new Error(`kku.json: ${r.status}`);
    return r.json();
  }).catch((err) => {
    cached = null; // offline or a failed request: try again next time
    throw err;
  });
  return cached;
}

/** Folds the spellings students mix up (hamzas, taa marbuta, alif maqsura, diacritics), so «الاحصاء» finds «الإحصاء». */
export const fold = (text) => String(text).toLowerCase()
  .replace(/[ً-ْـ]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ؤئ]/g, 'ء')
  .replace(/\s+/g, ' ').trim();

/** Does the course match an already folded query? An empty query matches everything. */
export const matches = (course, q) => !q || fold(course.title).includes(q) || (course.en ? fold(course.en).includes(q) : false);

export const channelUrl = (data) => `https://t.me/${data.channel}`;
export const botUrl = (data) => `https://t.me/${data.bot}`;
export const uniUrl = (data) => `https://t.me/${data.uni}`;
export const postUrl = (data, post) => `https://t.me/${data.channel}/${post}`;

/** The owner's Telegram directory on the page (data.telegram), in this order. */
export const TG_KINDS = ['channels', 'bots', 'groups'];
export const tgUrl = (handle) => `https://t.me/${handle}`;
