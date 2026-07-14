// SLCC康养PWA服务工作者 - 离线缓存/后台运行
const CACHE_VERSION = 'slcc-ky-v1.1.2';
// 核心缓存资源
const CACHE_ASSETS = [
  './index.html',
  './login.html',
  './manifest.json',
  '/'
];

// 安装：缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：删除旧缓存，接管所有页面
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_VERSION)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求：优先用缓存，无缓存走网络，离线兜底
self.addEventListener('fetch', (event) => {
  // 忽略跨域请求（字体/第三方资源/Supabase API）
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return cachedResponse || caches.match('./index.html');
        });

      return cachedResponse || networkFetch;
    })
  );
});
