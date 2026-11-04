/* My Princess · Imágenes editables de la página principal */
(()=> {
 const cfg=window.MY_PRINCESS_CONFIG||{};
 if(!window.supabase||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY)return;
 const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
 function publicUrl(path){return sb.storage.from("eventos").getPublicUrl(path).data.publicUrl;}
 async function apply(){
  try{
   const {data,error}=await sb.from("gallery_hero_settings").select("homepage_images").eq("id",true).maybeSingle();
   if(error)throw error;const images=data?.homepage_images||{};
   const applyBackground=(selector,item)=>{if(!item?.path)return;const el=document.querySelector(selector);if(!el)return;el.style.backgroundImage="url("+JSON.stringify(publicUrl(item.path))+")";el.style.backgroundPosition=(item.position_x??50)+"% "+(item.position_y??50)+"%";};
   applyBackground(".hero-photo",images.hero);applyBackground(".booking-photo",images.booking);
   for(let n=1;n<=5;n++){const item=images["portfolio_"+n];if(!item?.path)continue;const btn=document.querySelectorAll(".gallery-grid .gallery-item")[n-1],img=btn?.querySelector("img");if(img){img.src=publicUrl(item.path);img.style.objectPosition=(item.position_x??50)+"% "+(item.position_y??50)+"%";}if(btn)btn.dataset.image=publicUrl(item.path);}
   for(let n=1;n<=4;n++){const item=images["about_"+n],img=document.querySelectorAll(".team-grid .team-card img")[n-1];if(item?.path&&img){img.src=publicUrl(item.path);img.style.objectPosition=(item.position_x??50)+"% "+(item.position_y??50)+"%";}}
  }catch(err){console.warn("My Princess: no se pudieron cargar las imágenes personalizadas.",err);}
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();
})();