/* MY PRINCESS · ROYAL FLOW
   Marca secciones de contenido y activa suavemente sus detalles al entrar en pantalla. */
(()=>{
 "use strict";
 const init=()=>{
  const candidates=document.querySelectorAll("body > section, main > section, main > div > section, .wardrobe-main > section, .events-page > section, .account-main > section, .wrap > section, .wrap > div > section");
  let n=0;
  candidates.forEach(section=>{
   if(section.matches(".card,.request-modal-panel,[role='dialog'],.hidden")||section.closest("[role='dialog']"))return;
   section.classList.add("mp-flow-section");
   if(n%2)section.classList.add("mp-flow-alt");
   n++;
  });
  const sections=document.querySelectorAll(".mp-flow-section");
  if(!("IntersectionObserver" in window)){
   sections.forEach(s=>s.classList.add("mp-flow-seen"));
   return;
  }
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(entry.isIntersecting){
     entry.target.classList.add("mp-flow-seen");
     observer.unobserve(entry.target);
    }
   });
  },{threshold:.08,rootMargin:"0px 0px -6% 0px"});
  sections.forEach(s=>observer.observe(s));
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();