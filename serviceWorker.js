var CACHE_VERSION = 'restaurant-reviews-v1';
var CACHE_FILES = [
	'/',
    '/css/styles.css'
];

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(CACHE_VERSION).then(function (cache) {
			return cache.addAll(CACHE_FILES);
		})
	);
});

self.addEventListener('fetch', function (event) {
	event.respondWith(caches.match(event.request).then(function (response) {
		if (response !== undefined) {
			return response;
		} else {
			return fetch(event.request).then(function (response) {
				var responseClone = response.clone();
				if (event.request.method == 'GET') {
					caches.open(CACHE_VERSION).then(function (cache) {
						cache.put(event.request, responseClone);
					});
				}
				return response;
			});
		}
	}));
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function(keys){
            return Promise.all(keys.map(function(key, i){
                if(key !== CACHE_VERSION){
                    return caches.delete(keys[i]);
                }
            }));
        })
    );
});