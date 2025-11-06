const CACHE_NAME = 'fichas-rdo-cache-v1'; // Incremente a versão para forçar atualização
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './service-worker.js',
    // Adicione os ícones aqui se quiser que sejam cacheados:
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-192.png',
    './icons/icon-maskable-512.png',
    // Se usar fontes do Google Fonts, adicione-as também:
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.woff2' // Exemplo de fonte Roboto
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Instalação iniciada...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cache aberto, adicionando arquivos...');
                return cache.addAll(urlsToCache).catch(error => {
                    console.error('Service Worker: Falha ao adicionar ao cache:', error);
                    // Continue mesmo com erros, alguns recursos podem não ser essenciais
                });
            })
            .then(() => {
                console.log('Service Worker: Instalação concluída.');
                self.skipWaiting(); // Força a ativação imediata do novo SW
            })
            .catch(error => {
                console.error('Service Worker: Erro durante a instalação:', error);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Ativação iniciada...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Ativação concluída, caches antigos limpos.');
            self.clients.claim(); // Assume o controle de páginas não controladas
        })
    );
});

// Interceptação de Requisições (Fetch)
self.addEventListener('fetch', event => {
    // Apenas cacheia GET requests e ignora requisições de outros esquemas como chrome-extension://
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se encontrar no cache, retorna a versão cacheadas
                if (response) {
                    return response;
                }
                
                // Se não encontrar no cache, faz a requisição à rede
                return fetch(event.request)
                    .then(networkResponse => {
                        // Verifica se a resposta da rede é válida antes de cachear
                            return networkResponse;
                        }

                        // Clona a resposta para que uma cópia possa ser lida pelo cache e outra pelo navegador
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    })
                    .catch(() => {
                        // Se a rede falhar e não houver nada no cache (ou seja, offline),
                        // pode retornar uma página offline padrão ou um recurso de fallback.
                        console.warn('Service Worker: Falha na requisição de rede e sem cache para:', event.request.url);
                        // Opcional: retornar uma página offline aqui
                        // return caches.match('/offline.html'); 
                        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                    });
            })
    );
});