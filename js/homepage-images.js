/* My Princess · Imágenes editables de la página principal
   Lee la configuración desde el backend para evitar diferencias de permisos/RLS en el navegador. */
(()=>{
 const cfg=window.MY_PRINCESS_CONFIG||{};
 const api=(cfg.bookingApiBase||cfg.API_BASE_URL||"").replace(/\/+$/,"");
 const storageBase=String(cfg.SUPABASE_URL||"").replace(/\/+$/,"")+"/storage/v1/object/public/eventos/";
 if(!api||!cfg.SUPABASE_URL)return;
 function publicUrl(path){
  const encoded=String(path).split("/").map(encodeURIComponent).join("/");
  const filename=String(path).split("/").pop()||"image";
  return storageBase+encoded+"?mpv="+encodeURIComponent(filename);
 }
 async function readImages(){
  const response=await fetch(api+"/homepage-images?ts="+Date.now(),{cache:"no-store",headers:{Accept:"application/json"}});
  if(!response.ok)throw new Error("Backend respondió "+response.status);
  const payload=await response.json();
  return payload.images||{};
 }
 async function apply(){
  try{
   const images=await readImages();
   const applyBackground=(selector,item,suffix="")=>{
    if(!item?.path)return;
    const el=document.querySelector(selector);if(!el)return;
    el.style.setProperty("--mp-bg-image"+suffix,"url("+JSON.stringify(publicUrl(item.path))+")");
    el.style.setProperty("--mp-bg-position-x"+suffix,(item.position_x??50)+"%");
    el.style.setProperty("--mp-bg-position-y"+suffix,(item.position_y??50)+"%");
   };
   const desktopHero=images.hero_desktop?.path?images.hero_desktop:images.hero;
   const mobileHero=images.hero_mobile||{};
   applyBackground(".hero-photo",desktopHero,"-desktop");
   const shell=document.querySelector(".hero-benefits-shell");
   if(shell){
    applyBackground(".hero-benefits-shell",desktopHero,"-desktop");
    const mobilePath=mobileHero.path||desktopHero?.path;
    if(mobilePath)shell.style.setProperty("--mp-bg-image-mobile","url("+JSON.stringify(publicUrl(mobilePath))+")");
    shell.style.setProperty("--mp-bg-position-x-mobile",(mobileHero.position_x??desktopHero?.position_x??50)+"%");
    shell.style.setProperty("--mp-bg-position-y-mobile",(mobileHero.position_y??desktopHero?.position_y??50)+"%");
   }
   const hero=document.querySelector(".hero-photo");
   if(hero){
    const mobilePath=mobileHero.path||desktopHero?.path;
    if(mobilePath)hero.style.setProperty("--mp-bg-image-mobile","url("+JSON.stringify(publicUrl(mobilePath))+")");
    hero.style.setProperty("--mp-bg-position-x-mobile",(mobileHero.position_x??desktopHero?.position_x??50)+"%");
    hero.style.setProperty("--mp-bg-position-y-mobile",(mobileHero.position_y??desktopHero?.position_y??50)+"%");
   }
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
  }catch(err){console.warn("My Princess: no se pudieron cargar las imágenes personalizadas.",err);}
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();
})();