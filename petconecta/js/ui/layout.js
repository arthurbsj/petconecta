/* Interface comum: cabeçalho, sino de notificações, avisos e modais. */
(function(PC){
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const idade=m=>m<12?m+' meses':Math.floor(m/12)+(m<24?' ano':' anos');
const foto=p=>`<span class="foto" style="background:hsl(${[...p.id].reduce((a,c)=>a+c.charCodeAt(0)*7,0)%360} 40% 40%)" title="Ilustração fictícia">${p.especie==='Gato'?'🐱':'🐶'}</span>`;
function toast(msg,tipo='ok'){const t=document.createElement('div');t.className='toast '+tipo;t.textContent=msg;t.setAttribute('role','status');document.body.appendChild(t);setTimeout(()=>t.remove(),4000);}
function modal(titulo,html){const m=document.createElement('div');m.className='fundo';m.innerHTML=`<div class="modal card" role="dialog" aria-modal="true" aria-label="${esc(titulo)}"><button class="x" aria-label="Fechar">×</button><h2>${esc(titulo)}</h2>${html}</div>`;
 m.fechar=()=>m.remove();m.querySelector('.x').onclick=m.fechar;m.onclick=e=>{if(e.target===m)m.fechar();};document.body.appendChild(m);return m;}
function iniciar(pag){
 const L=[['index.html','Meu Pet','meu'],['catalogo.html','Catálogo de Adoção','catalogo'],['ong.html','Área da ONG','ong']],topo=document.getElementById('topo');
 topo.innerHTML=`<span class="logo">🐾 PetConecta</span><nav>${L.map(l=>`<a href="${l[0]}" class="${l[2]===pag?'on':''}">${l[1]}</a>`).join('')}</nav><div class="sino"><button id="bSino" aria-label="Notificações">🔔<b id="nSino" hidden></b></button><div id="lSino" class="lista-sino" hidden></div></div>`;
 topo.insertAdjacentHTML('afterend','<div class="demo">Modo demonstração: dados fictícios salvos só neste navegador. Nenhum rastreador real está conectado.</div>');
 document.querySelector('footer').innerHTML='<button id="bRest" class="btn sec">Restaurar dados de demonstração</button>';
 document.getElementById('bRest').onclick=()=>{if(confirm('Apagar todos os dados de demonstração e recomeçar?')){PC.armazenamento.limparTudo();location.reload();}};
 const n=document.getElementById('nSino'),l=document.getElementById('lSino');
 const atual=async()=>{const a=await PC.dados.alertas.listar(),nl=a.filter(x=>!x.lida).length;n.hidden=!nl;n.textContent=nl;
  l.innerHTML=(a.slice(0,8).map(x=>`<p class="${x.tipo}"><b>${esc(x.petNome)}</b> ${esc(x.mensagem)}<br><small>${new Date(x.em).toLocaleString('pt-BR')}</small></p>`).join('')||'<p>Nenhum alerta ainda.</p>')+'<button class="btn sec" id="bLidas">Marcar como lidas</button>';
  l.querySelector('#bLidas').onclick=()=>PC.dados.alertas.marcarLidas();};
 document.getElementById('bSino').onclick=()=>{l.hidden=!l.hidden;};
 document.addEventListener('alertas:mudou',atual);atual();PC.dados.acompanhamento.verificar();}
PC.ui={esc,idade,foto,toast,modal,iniciar};})(window.PC);
