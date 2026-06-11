import assert from 'node:assert/strict';
import { createShareCardState, getShareCardDateStamp } from '../new-site/public/assets/share-card.js';

const refValues = [];
const ref = value => {
  const holder = { value };
  refValues.push(holder);
  return holder;
};

const messages = [];
const clicked = [];
const element = { id: 'share-card' };
const html2canvasImpl = async (target, options) => {
  assert.equal(target, element, 'share target mismatch');
  assert.equal(options.backgroundColor, '#f7f5ee');
  assert.equal(options.scale, 2);
  assert.equal(options.useCORS, true);
  return { toDataURL: () => 'data:image/png;base64,test' };
};

const controller = createShareCardState(ref, (msg, type) => messages.push({ msg, type }), {
  filenamePrefix: '碳循校园-测试',
  now: () => new Date('2026-05-09T12:00:00Z'),
  html2canvasImpl,
  createLink: () => ({
    set download(value) { this._download = value; },
    get download() { return this._download; },
    set href(value) { this._href = value; },
    get href() { return this._href; },
    click() { clicked.push({ download: this.download, href: this.href }); },
  }),
});

controller.shareCardRef.value = element;
await controller.generateShareCard();

assert.equal(controller.generating.value, false, 'generating should reset');
assert.deepEqual(clicked, [{
  download: '碳循校园-测试-2026-05-09.png',
  href: 'data:image/png;base64,test',
}]);
assert.deepEqual(messages, [{ msg: '分享卡片已保存到本地', type: undefined }]);
assert.equal(getShareCardDateStamp(new Date('2026-05-09T23:59:59Z')), '2026-05-09');
assert.equal(refValues.length, 2, 'share state should create two refs');

const previousHtml2Canvas = globalThis.html2canvas;
try {
  delete globalThis.html2canvas;
  const missingMessages = [];
  const missing = createShareCardState(ref, (msg, type) => missingMessages.push({ msg, type }));
  missing.shareCardRef.value = element;
  await missing.generateShareCard();
  assert.equal(missing.generating.value, false, 'generating should reset when renderer is missing');
  assert.deepEqual(missingMessages, [{ msg: '分享功能需要网络加载依赖库，请联网后刷新页面重试', type: 'danger' }]);
} finally {
  if (previousHtml2Canvas) globalThis.html2canvas = previousHtml2Canvas;
}

console.log('share card controller passed');
