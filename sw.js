const CACHE='shinchan-shifts-v3-20261026';
const ASSETS=['./','./index.html','./styles.css','./app.js','./schedule-core.js','./schedule.json','./manifest.json','./assets/shinchan.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&(k.startsWith('shinchan-shifts-')||k.startsWith('shift-pwa-'))).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const path=url.pathname;
 const fresh=event.request.mode==='navigate'||/\.(json|js|css)$/.test(path);
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(!fresh){const hit=await cache.match(event.request);if(hit)return hit;}
  try{
   const response=await fetch(event.request);
   if(response.ok)await cache.put(event.request,response.clone());
   if(response.ok)return response;
   return await cache.match(event.request)||response;
  }catch{
   const hit=await cache.match(event.request);
   if(hit)return hit;
   if(event.request.mode==='navigate'){const shell=await cache.match('./index.html');if(shell)return shell;}
   return Response.error();
  }
 })());
});
