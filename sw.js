// SLCC康养PWA服务工作者 - 离线缓存/后台运行
const CACHE_VERSION = 'slcc-ky-v1.0.0';
// 核心缓存资源（内置SVG图标，无需额外文件）
const CACHE_ASSETS = [
  '/slcc-full-app.html',
  '/manifest.json',
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
  // 忽略跨域请求（字体/第三方资源）
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }
