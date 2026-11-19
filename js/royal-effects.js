/* My Princess · pétalos y destellos ambientales ligeros */
(()=>{
 if(document.getElementById("mp-ambient-effects"))return;
 const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const layer=document.createElement("div");layer.id="mp-ambient-effects";layer.setAttribute("aria-hidden","true");
 const glow1=document.createElement("i");glow1.className="mp-glow mp-glow-one";
 const glow2=document.createElement("i");glow2.className="mp-glow mp-glow-two";
 layer.append(glow1,glow2);
 if(!reduce){
  const mobile=window.matchMedia("(max-width: 700px)").matches;
  const petals=mobile?7:13, sparks=mobile?9:17;
  for(let n=0;n<petals;n++){
   const p=document.createElement("i");p.className="mp-petal";
   p.style.setProperty("--x",(Math.random()*100).toFixed(2)+"%");
   p.style.setProperty("--size",(8+Math.random()*11).toFixed(1)+"px");
   p.style.setProperty("--duration",(17+Math.random()*17).toFixed(1)+"s");
   p.style.setProperty("--delay",(-Math.random()*32).toFixed(1)+"s");
   p.style.setProperty("--rot",(Math.random()*300-150).toFixed(0)+"deg");
   p.style.setProperty("--sway",(Math.random()*100-50).toFixed(0)+"px");
   layer.appendChild(p);
  }
  for(let n=0;n<sparks;n++){
   const s=document.createElement("i");s.className="mp-sparkle";
   s.style.setProperty("--x",(Math.random()*100).toFixed(2)+"%");
   s.style.setProperty("--y",(Math.random()*100).toFixed(2)+"%");
   s.style.setProperty("--size",(2+Math.random()*2.5).toFixed(1)+"px");
   s.style.setProperty("--duration",(3.5+Math.random()*5).toFixed(1)+"s");
   s.style.setProperty("--delay",(-Math.random()*8).toFixed(1)+"s");
   layer.appendChild(s);
  }
 }
 const mount=()=>{if(!document.getElementById("mp-ambient-effects"))document.body.prepend(layer);};
 if(document.body)mount();else document.addEventListener("DOMContentLoaded",mount,{once:true});
})();