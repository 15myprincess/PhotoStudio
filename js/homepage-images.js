/* My Princess · Imágenes editables de la página principal
   Muestra primero la última portada conocida y actualiza en segundo plano desde Administración. */
(()=>{
 const cfg=window.MY_PRINCESS_CONFIG||{};
 const api=(cfg.bookingApiBase||cfg.API_BASE_URL||"").replace(/\/+$/,"");
 const storageBase=String(cfg.SUPABASE_URL||"").replace(/\/+$/,"")+"/storage/v1/object/public/eventos/";
 const CACHE_KEY="mp_homepage_images_cache_v2";
 function publicUrl(path){
  const encoded=String(path).split("/").map(encodeURIComponent).join("/");
  const filename=String(path).split("/").pop()||"image";
  return storageBase+encoded+"?mpv="+encodeURIComponent(filename);
 }
 function setPosition(el,item,suffix=""){
  if(!el||!item)return;
  el.style.setProperty("--mp-bg-position-x"+suffix,(item.position_x??50)+"%");
  el.style.setProperty("--mp-bg-position-y"+suffix,(item.position_y??50)+"%");
 }
 function applyHero(images){
  const desktop=images.hero_desktop?.path?images.hero_desktop:images.hero;
  const mobile=images.hero_mobile||{};
  const hero=document.querySelector(".hero-photo");
  const shell=document.querySelector(".hero-benefits-shell");
  if(!desktop?.path)return;
  const desktopUrl=publicUrl(desktop.path);
  [hero,shell].forEach(el=>{
   if(!el)return;
   el.style.setProperty("--mp-bg-image-desktop","url("+JSON.stringify(desktopUrl)+")");
   setPosition(el,desktop,"-desktop");
  });
  const mobilePath=mobile.path||desktop.path;
  const mobileUrl=publicUrl(mobilePath);
  [hero,shell].forEach(el=>{
   if(!el)return;
   el.style.setProperty("--mp-bg-image-mobile","url("+JSON.stringify(mobileUrl)+")");
   setPosition(el,{position_x:mobile.position_x??desktop.position_x,position_y:mobile.position_y??desktop.position_y},"-mobile");
  });
 }
 function warmHero(images){
  const desktop=images.hero_desktop?.path?images.hero_desktop:images.hero;
  const mobile=images.hero_mobile||{};
  const path=window.matchMedia("(max-width:760px)").matches?(mobile.path||desktop?.path):desktop?.path;
  if(!path)return Promise.resolve();
  return new Promise(resolve=>{
   const image=new Image();
   image.fetchPriority="high";
   image.onload=()=>resolve();
   image.onerror=()=>resolve();
   image.src=publicUrl(path);
   if(image.complete)resolve();
  });
 }
 async function readImages(){
  const response=await fetch(api+"/homepage-images?ts="+Date.now(),{cache:"no-store",headers:{Accept:"application/json"}});
  if(!response.ok)throw new Error("Backend respondió "+response.status);
  const payload=await response.json();
  return payload.images||{};
 }
 async function apply(){
  let cached={};
  try{cached=JSON.parse(localStorage.getItem(CACHE_KEY)||"{}")||{};}catch(_){}
  // La portada guardada se aplica de forma síncrona, antes de esperar al backend.
  if(cached.hero_desktop||cached.hero||cached.hero_mobile)applyHero(cached);
  if(!api||!cfg.SUPABASE_URL)return;
  try{
   const images=await readImages();
   const desktop=images.hero_desktop?.path?images.hero_desktop:images.hero;
   const oldDesktop=cached.hero_desktop?.path||cached.hero?.path||"";
   const newDesktop=desktop?.path||"";
   const oldMobile=cached.hero_mobile?.path||"";
   const newMobile=images.hero_mobile?.path||"";
   const heroChanged=oldDesktop!==newDesktop||oldMobile!==newMobile;
   if(heroChanged)await warmHero(images);
   applyHero(images);
   try{localStorage.setItem(CACHE_KEY,JSON.stringify({
    hero_desktop:images.hero_desktop||null,
    hero_mobile:images.hero_mobile||null,
    hero:images.hero||null
   }));}catch(_){}
   // El resto de las imágenes continúa actualizándose sin alterar el comportamiento existente.
   applyBackground(".booking-photo",images.booking);
   for(let n=1;n<=5;n++){
    const item=images["portfolio_"+n];if(!item?.path)continue;
    const btn=document.querySelectorAll(".gallery-grid .gallery-item")[n-1],img=btn?.querySelector("img");
    if(img){img.src=publicUrl(item.path);img.style.objectPosition=(item.position_x??50)+"% "+(item.position_y??50)+"%";}
    if(btn)btn.dataset.image=publicUrl(item.path);
   }
   for(let n=1;n<=4;n++){
    const item=images["about_"+n],img=document.querySelectorAll(".team-grid .team-card img")[n-1];
    if(item?.path&&img){img.src=publicUrl(item.path);img.style.objectPosition=(item.position_x??50)+"% "+(item.position_y??50)+"%";}
   }
  }catch(err){console.warn("My Princess: no se pudieron actualizar las imágenes personalizadas.",err);}
 }
 function applyBackground(selector,item){
  if(!item?.path)return;
  const el=document.querySelector(selector);if(!el)return;
  el.style.setProperty("--mp-bg-image","url("+JSON.stringify(publicUrl(item.path))+")");
  el.style.setProperty("--mp-bg-position-x",(item.position_x??50)+"%");
  el.style.setProperty("--mp-bg-position-y",(item.position_y??50)+"%");
 }
 apply();
})();