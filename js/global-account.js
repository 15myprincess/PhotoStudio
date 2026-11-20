/* My Princess · sesión y avatar compartidos en todas las páginas públicas */
(() => {
  'use strict';
  const header=document.querySelector('.header');
  if(!header)return;
  let account=document.getElementById('accountIndicator');
  if(!account){
    account=document.createElement('a');
    account.href='cuenta.html';
    account.className='account-indicator mp-global-account';
    account.id='accountIndicator';
    account.setAttribute('aria-label','Mi cuenta');
    account.innerHTML='<span class="account-avatar" id="accountAvatar" aria-hidden="true">♙</span><span class="account-online-dot" id="accountOnlineDot" aria-label="Desconectado"></span>';
    const menu=header.querySelector('.menu-toggle');
    const brand=header.querySelector('.brand');
    if(menu)header.insertBefore(account,menu);else if(brand)brand.insertAdjacentElement('afterend',account);else header.appendChild(account);
  }
  account.classList.add('mp-global-account');
  let avatar=account.querySelector('.account-avatar');
  if(!avatar){avatar=document.createElement('span');avatar.className='account-avatar';avatar.id='accountAvatar';avatar.setAttribute('aria-hidden','true');avatar.textContent='♙';account.prepend(avatar);}
  let dot=account.querySelector('.account-online-dot');
  if(!dot){dot=document.createElement('span');dot.className='account-online-dot';dot.id='accountOnlineDot';dot.setAttribute('aria-label','Desconectado');account.append(dot);}
  const cfg=window.MY_PRINCESS_CONFIG||{};
  const offline=()=>{account.classList.remove('is-logged-in');avatar.textContent='♙';avatar.style.backgroundImage='';dot.setAttribute('aria-label','Desconectado');account.setAttribute('aria-label','Iniciar sesión o crear una cuenta');account.title='Mi cuenta';};
  if(!window.supabase||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY){offline();return;}
  try{
    const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
    const refresh=user=>{
      if(!user){offline();return;}
      const meta=user.user_metadata||{};
      const photo=String(meta.avatar_url||meta.picture||meta.photo_url||'').trim();
      avatar.textContent=photo?'':'♙';
      avatar.style.backgroundImage=photo?'url("'+photo.replace(/["\\\\)]/g,'')+'")':'';
      account.classList.add('is-logged-in');
      dot.setAttribute('aria-label','Conectado');
      account.setAttribute('aria-label','Sesión iniciada. Abrir mi cuenta');
      account.title='Mi cuenta · Sesión iniciada';
    };
    sb.auth.getSession().then(({data})=>refresh(data.session?.user||null)).catch(offline);
    sb.auth.onAuthStateChange((event,session)=>{if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED','SIGNED_OUT'].includes(event))setTimeout(()=>refresh(session?.user||null),0);});
  }catch(error){console.warn('No se pudo actualizar el avatar de cuenta.',error);offline();}
})();
