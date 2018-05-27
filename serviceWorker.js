self.importScripts("/js/idb.js");
var cacheName = 'restaurant-review-App';

var filesToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/js/main.js',
    '/css/styles.css'
  ];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
      caches.keys().then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== cacheName) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
    );
    return self.clients.claim();
  });

  self.addEventListener('fetch', function(e) {
    console.log('[ServiceWorker] Fetch', e.request.url);
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  });
  self.addEventListener('sync', function (e) {
    if (e.tag === 'sync') {
      e.waitUntil(
        sendReviews().then(() => {
          console.log('synced');
        }).catch(err => {
          console.log(err, 'error syncing');
        })
      );
	  } else if (e.tag === 'favorite') {
    e.waitUntil(
      sendFavorites().then(() => {
        console.log('favorites synced');
      }).catch(err => {
        console.log(err, 'error syncing favorites');
      })
    );
    }});

    function sendReviews() {
      return idb.open('Restaurant Reviews', 4).then(db => {
        let tx = db.transaction('outbox', 'readonly');
        return tx.objectStore('outbox').getAll();
      }).then(reviews => {
        return Promise.all(reviews.map(review => {
          let reviewID = review.id;
          delete review.id;
          console.log("sending review....", review);
          return fetch('http://localhost:1337/reviews', {
            method: 'POST',
            body: JSON.stringify(review),
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }).then(response => {
            console.log(response);
            return response.json();
          }).then(data => {
            console.log('added review!', data);
            if (data) {
              idb.open('Restaurant Reviews', 4).then(db => {
                let tx = db.transaction('outbox', 'readwrite');
                return tx.objectStore('outbox').delete(reviewID);
              });
            }
          });
        }));
      });
    }

function sendFavorites() {
  return idb.open('favorite', 1).then(db => {
    let tx = db.transaction('outbox', 'readonly');
    return tx.objectStore('outbox').getAll();
  }).then(items => {
    return Promise.all(items.map(item => {
      let id = item.id;
      console.log("sending favorite", item);
      return fetch(`http://localhost:1337/restaurants/${item.resId}/?is_favorite=${item.favorite}`, {
        method: 'PUT'
      }).then(response => {
        console.log(response);
        return response.json();
      }).then(data => {
        console.log('added favorite', data);
        if (data) {
          idb.open('favorite', 1).then(db => {
            let tx = db.transaction('outbox', 'readwrite');
            return tx.objectStore('outbox').delete(id);
          });
        }
      });
    }));
  });
}