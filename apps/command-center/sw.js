const CACHE = 'cc-shell-v2';
const SHELL = [
  '/index.html',
  '/ideas.html',
  '/recipes.html',
  '/gallery.html',
  '/crons.html',
  '/users.html',
  '/leads.html',
  '/client-health.html',
  '/agents.html',
  'https://shared.adam-harris.alphaclaw.app/theme.css',
  'https://shared.adam-harris.alphaclaw.app/components/index.js',
  'modules/index.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for data, cache-first for shell assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Data requests — always network
  if (url.pathname.startsWith('/data/') || url.pathname.startsWith('/api/')) return;
  
  e.respondWith(
    fetch(e.request).then(res => {
      // Cache successful responses for shell assets
      if (res.ok && (e.request.url.includes('theme.css') || e.request.url.includes('index.js') || url.pathname.endsWith('.html'))) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
