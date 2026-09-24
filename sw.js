const CACHE_NAME = 'xieyingeng-cache-v1';

self.addEventListener('install', event => {
    // 讓新的 Service Worker 立即生效
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // 針對騰訊雲 COS 的圖片進行快取攔截
    if (url.hostname === 'lzc-1305165225.cos.ap-guangzhou.myqcloud.com') {
        event.respondWith(
            caches.match(event.request).then(response => {
                // 如果快取裡有這張圖，直接返回快取 (離線可用、秒開)
                if (response) {
                    return response;
                }
                
                // 如果沒有，則發起網路請求
                // 這裡使用 no-cors 模式，以支援跨域圖片的快取 (Opaque response)
                const fetchRequest = new Request(event.request.url, { mode: 'no-cors' });
                return fetch(fetchRequest).then(networkResponse => {
                    // Opaque response 的 status 為 0
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // 斷網且沒有快取時的防呆處理
                    console.error('Fetch failed, offline and no cache available.');
                });
            })
        );
    }
});
