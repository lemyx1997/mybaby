// Giúp ứng dụng mở được khi không có mạng: lưu sẵn phần chính, bản nhạc nào đã nghe thì lưu lại để lần sau nghe offline.
const CORE = 'mybaby-core-v5', MUSIC = 'mybaby-nhac-v1';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CORE && k !== MUSIC).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Nhạc và giọng đọc: tải trọn bài lần đầu rồi lưu lại (bỏ qua yêu cầu tải từng đoạn để lưu được cả bài).
  if (/\/(music|voice)\//.test(url.pathname)) {
    e.respondWith(caches.open(MUSIC).then(async c => (await c.match(url.pathname)) || fetch(url.pathname).then(r => { if (r.ok) c.put(url.pathname, r.clone()); return r; })));
    return;
  }
  // Phần chính: ưu tiên bản mới trên mạng, mất mạng thì dùng bản đã lưu.
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { if (r.ok) caches.open(CORE).then(c => c.put(req, r.clone())); return r; }).catch(() => caches.match(req)));
  }
});
