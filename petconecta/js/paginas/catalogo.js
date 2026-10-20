/* Controlador do Catálogo de Adoção: filtros, favoritos e formulário de interesse. */
(async function(PC){
const {dados,regras,ui}=PC,$=id=>document.getElementById(id);ui.iniciar('catalogo');
let pets=[],favs=[];const st={disponivel:'Disponível',analise:'Em análise',adotado:'Adotado'};
async function carregar(){pets=await PC.petService.listar();favs=await dados.favoritos.listar();desenhar();}
function desenhar(){
 const f={q:$('q').value,especie:$('esp').value,porte:$('porte').value,sexo:$('sexo').value,idade:$('idade').value,status:$('status').value,fav:$('fav').checked},l=regras.filtrar(pets,f,favs);
 $('n').textContent=l.length+' animal(is) encontrado(s)';
 $('lista').innerHTML=l.map(p=>`<article class="card">${ui.foto(p)}<button class="fav" data-a="fav" data-id="${p.id}" aria-label="Favoritar ${ui.esc(p.nome)}">${favs.includes(p.id)?'❤️':'🤍'}</button><h3>${ui.esc(p.nome)}</h3><p><span class="tag">${p.especie}</span><span class="tag">${p.porte}</span><span class="tag">${p.sexo}</span><span class="tag">${ui.idade(p.meses)}</span></p><p>${ui.esc(p.raca)} · ${st[p.status]}</p><div class="btns"><button class="btn sec" data-a="det" data-id="${p.id}">Detalhes</button><button class="btn ouro" data-a="ado" data-id="${p.id}" ${p.status!=='disponivel'?'disabled':''}>Quero adotar</button></div></article>`).join('')||'<div class="card">Nenhum animal com esses filtros. Limpe os filtros para ver todos.</div>';}
function adotar(p){
 const m=ui.modal('Quero adotar '+p.nome,`<form id="f" novalidate><label>Nome completo<input name="nome" required></label><label>E-mail<input name="email" type="email" required></label><label>Telefone<input name="telefone" required></label><label>Moradia<select name="moradia"><option>Casa</option><option>Apartamento</option></select></label><label>Por que deseja adotar?<textarea name="mensagem" rows="3"></textarea></label><p class="aviso">Formulário demonstrativo: nada é enviado a uma ONG real.</p><button class="btn ouro">Enviar interesse</button></form>`);
 m.querySelector('#f').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
  if(!d.nome.trim()||!/^\S+@\S+\.\S+$/.test(d.email)||d.telefone.trim().length<8)return ui.toast('Informe nome, e-mail válido e telefone.','erro');
  await dados.solicitacoes.criar({...d,petId:p.id,petNome:p.nome});await PC.petService.atualizar(p.id,{status:'analise'});await dados.atividades.registrar('Novo interesse em adotar '+p.nome);
  m.fechar();ui.toast('Interesse registrado!');carregar();};}
$('lista').onclick=async e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const p=pets.find(x=>x.id===b.dataset.id);
 if(b.dataset.a==='fav'){favs=await dados.favoritos.alternar(p.id);desenhar();}
 else if(b.dataset.a==='det')ui.modal(p.nome,`${ui.foto(p)}<p>${ui.esc(p.raca)} · ${ui.idade(p.meses)} · ${p.porte} · ${p.sexo}</p><p>${ui.esc(p.descricao)}</p>`);
 else adotar(p);};
['q','esp','porte','sexo','idade','status','fav'].forEach(i=>$(i).oninput=desenhar);
$('limpar').onclick=()=>{['q','esp','porte','sexo','idade'].forEach(i=>$(i).value='');$('status').value='disponivel';$('fav').checked=false;desenhar();};
carregar();})(window.PC);
