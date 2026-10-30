(() => {
 const albums = {
 halloween:{title:'Halloween',description:'Una noche de fantasía, misterio y encanto.',images:['photo-1509557965875-b88c97052f0e','photo-1572375992501-4b0892d50c69','photo-1518709268805-4e9042af9f23','photo-1513519245088-0e12902e5a38','photo-1509248961158-e54f6934749c','photo-1514525253161-7a46d19cd819']},
 'san-valentin':{title:'San Valentín',description:'Romance en cada detalle y cada mirada.',images:['photo-1518895949257-7621c3c786d7','photo-1516589178581-6cd7833ae3b2','photo-1518199266791-5375a83190b7','photo-1518621736915-f3b1c41bfd00','photo-1522673607200-164d1b6ce486','photo-1497380281574-9e5b7e1f1e5c']},
 navidad:{title:'Navidad mágica',description:'Luces, ilusión y recuerdos en familia.',images:['photo-1512389142860-9c449e58a543','photo-1512909006721-3d6018887383','photo-1543589077-47d81606c1bf','photo-1510798831971-661eb04b3739','photo-1513297887119-dc283d9e7b1b','photo-1482517967863-00e15c9b44be']},
 quince:{title:'Mis quince',description:'El comienzo de una historia inolvidable.',images:['photo-1511795409834-ef04bbd61622','photo-1519741497674-611481863552','photo-1464366400600-7168b8af9bc3','photo-1519225421980-715cb0215aed','photo-1465495976277-4387d4b0e4a6','photo-1519167758481-83f550bb49b3']}
 };
 const modal=document.getElementById('albumModal'),grid=document.getElementById('albumGrid'),title=document.getElementById('albumTitle'),desc=document.getElementById('albumDescription');
 if(!modal||!grid)return;
 const openAlbum=key=>{const a=albums[key];if(!a)return;title.textContent=a.title;desc.textContent=a.description;grid.innerHTML=a.images.map((id,i)=>'<button type="button" aria-label="Ver fotografía '+(i+1)+'"><img loading="lazy" src="https://images.unsplash.com/'+id+'?auto=format&fit=crop&w=900&q=85" alt="'+a.title+' — fotografía de muestra '+(i+1)+'"></button>').join('');modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';};
 const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';};
 document.querySelectorAll('.event-card').forEach(card=>card.addEventListener('click',()=>openAlbum(card.dataset.event)));
 document.getElementById('albumClose')?.addEventListener('click',close);
 modal.addEventListener('click',e=>{if(e.target===modal)close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 document.querySelectorAll('.filter-chip').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter-chip').forEach(b=>b.classList.toggle('active',b===btn));let n=0;document.querySelectorAll('.event-card').forEach(card=>{const show=btn.dataset.filter==='todos'||card.dataset.category===btn.dataset.filter;card.hidden=!show;if(show)n++;});document.getElementById('collectionCount').textContent=n+' colecciones';}));
})();