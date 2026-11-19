/* My Princess · Imágenes editables de la página principal */
(()=> {
 const cfg=window.MY_PRINCESS_CONFIG||{};
 if(!window.supabase||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)return;
 const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
 function publicUrl(path){
  const base=sb.storage.from("eventos").getPublicUrl(path).data.publicUrl;
  const join=base.includes("?")?"&":"?";
  return base+join+"mpv="+encodeURIComponent(path.split("/").pop()||String(Date.now()));
 }
 async function apply(){
  try{
   const {data,error}=await sb.from("gallery_hero_settings").select("homepage_images").eq("id",true).maybeSingle();
   if(error)throw error;const images=data?.homepage_images||{};
   const applyBackground=(selector,item,propertySuffix="")=>{if(!item?.path)return;const el=document.querySelector(selector);if(!el)return;el.style.setProperty("--mp-bg-image"+propertySuffix,"url("+JSON.stringify(publicUrl(item.path))+")");el.style.setProperty("--mp-bg-position-x"+propertySuffix,(item.position_x??50)+"%");el.style.setProperty("--mp-bg-position-y"+propertySuffix,(item.position_y??50)+"%");};
   const desktopHero=images.hero_desktop?.path?images.hero_desktop:images.hero;
   const mobileHero=images.hero_mobile||{};
   applyBackground(".hero-photo",desktopHero,"-desktop");
   const shell=document.querySelector(".hero-benefits-shell");
   if(shell){
    applyBackground(".hero-benefits-shell",desktopHero,"-desktop");
    const shellMobileSource=mobileHero.path?mobileHero.path:desktopHero?.path;
    if(shellMobileSource)shell.style.setProperty("--mp-bg-image-mobile","url("+JSON.stringify(publicUrl(shellMobileSource))+")");
    shell.style.setProperty("--mp-bg-position-x-mobile",(mobileHero.position_x??desktopHero?.position_x??50)+"%");
    shell.style.setProperty("--mp-bg-position-y-mobile",(mobileHero.position_y??desktopHero?.position_y??50)+"%");
   }
   const heroEl=document.querySelector(".hero-photo");
   if(heroEl){
    const mobileSource=mobileHero.path?mobileHero.path:desktopHero?.path;
    if(mobileSource)heroEl.style.setProperty("--mp-bg-image-mobile","url("+JSON.stringify(publicUrl(mobileSource))+")");
    heroEl.style.setProperty("--mp-bg-position-x-mobile",(mobileHero.position_x??desktopHero?.position_x??50)+"%");
    heroEl.style.setProperty("--mp-bg-position-y-mobile",(mobileHero.position_y??desktopHero?.position_y??50)+"%");
   }
   applyBackground(".booking-photo",images.booking);
   for(let n=1;n<=5;n++){const item=images["portfolio_"+n];if(!item?.path)continue;const btn=document.querySelectorAll(".gallery-grid .gallery-item")[n-1],img=btn?.querySelector("img");if(img){img.src=publicUrl(item.path);img.style.objectPosition=(item.position_x??50)+"% "+(item.position_y??50)+"%";}if(btn)btn.dataset.image=publicUrl(item.path);}
   for(let n=1;n<=4;n++){const item=images["about_"+n],img=document.querySelectorAll(".team-grid .team-card img")[n-1];if(item?.path&&img){img.src=publicUrl(item.path);img.style.objectPosition=(item.position_x??50)+"% "+(item.position_y??50)+"%";}}
  }catch(err){console.warn("My Princess: no se pudieron cargar las imágenes personalizadas.",err);}
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();
})();