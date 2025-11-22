const CACHE_NAME = 'photoverse-cache-v4'; // Bump version to ensure update
const URLS_TO_CACHE = [
  // App Shell
  '/',
  '/index.html',
  '/manifest.json',

  // Icons
  '/icon-48x48.png',
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-192x192.png',
  '/icon-256x256.png',
  '/icon-384x384.png',
  '/icon-512x512.png',
  
  // Scripts & Styles (Local)
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.tsx',
  '/translations.ts',
  '/services/geminiService.ts',
  '/components/SplashScreen.tsx',
  '/components/UploadScreen.tsx',
  '/components/ProcessingScreen.tsx',
  '/components/ResultScreen.tsx',
  '/components/ClayButton.tsx',
  '/components/SelectionCard.tsx',

  // CDN Resources
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://aistudiocdn.com/@google/genai@^1.20.0',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1',
  'https://aistudiocdn.com/lucide-react@^0.544.0'
];

// Instala el service worker y cachea los recursos principales de la aplicación.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Force activation
  );
});

// Intercepta las peticiones de red y responde con los recursos cacheados si están disponibles.
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // We don't cache calls to the Gemini API
                if (!event.request.url.includes('generativelanguage')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        ).catch(error => {
            // This is a simplified offline fallback. 
            // You might want to return a custom offline page here.
            console.error('Fetching failed:', error);
            throw error;
        });
      })
  );
});


// Activa el service worker y elimina cachés antiguas para mantener la aplicación actualizada.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages
  );
});
