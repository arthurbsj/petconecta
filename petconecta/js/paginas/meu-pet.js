/* Controlador da página Meu Pet: liga simulador, regras, mapa e alertas. */
(async function(PC){
const {dados,regras,ui}=PC,$=id=>document.getElementById(id);ui.iniciar('meu');
const pets=(await PC.petService.listar()).filter(p=>p.tutor);
if(!pets.length){document.querySelector('main').innerHTML='<div class="card">Nenhum pet adotado. Aprove uma adoção na Área da ONG.</div>';return;}
const cores={seguro:'#2e8b57',atencao:'#d98e04',fuga:'#c0392b'},rot={seguro:'Dentro da área segura',atencao:'Fora do raio de segurança',fuga:'Possível fuga detectada'},modos={passeio:'Passeio',fuga:'Fuga simulada',retorno:'Retornando',parado:'Parado'};
let pet,raio,sim,estado='seguro',trilha=[];const mapa=new PC.Mapa('mapa');
$('selPet').innerHTML=pets.map(p=>`<option value="${p.id}">${ui.esc(p.nome)}</option>`).join('');
function mostrar(pos){const d=regras.distancia(pos,pet.casa);
 $('estado').textContent=rot[estado];$('estado').className='badge '+estado;
 $('metricas').innerHTML=`<dt>Distância de casa</dt><dd>${Math.round(d)} m</dd><dt>Raio de segurança</dt><dd>${raio} m</dd><dt>Modo</dt><dd>${modos[sim.modo]}</dd><dt>Coordenadas</dt><dd>${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}</dd>`;
 $('chegar').innerHTML=`<h3>Como chegar</h3><p>${Math.round(d)} m a ${regras.cardeal(regras.rumo(pet.casa,pos))} de casa. A pé: cerca de ${Math.max(1,Math.round(d/80))} min.</p><a class="btn ouro" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${pos.lat},${pos.lng}&travelmode=walking">Abrir rota em outro mapa</a>`;
 mapa.atualizar(pet.casa,raio,pos,trilha,cores[estado]);}
async function hist(){const e=await dados.historico.eventos(pet.id),n={saida:'Saiu da área segura',fuga:'Possível fuga',retorno:'Voltou à área segura'};
 $('hist').innerHTML=e.slice(0,8).map(x=>`<li>${new Date(x.em).toLocaleString('pt-BR')} – ${n[x.tipo]} (${x.distancia} m)</li>`).join('')||'<li>Sem eventos. Inicie uma fuga simulada para testar.</li>';}
const botoes=()=>{$('bIniciar').textContent=sim.ativo()?'Pausar simulação':'Iniciar simulação';};
async function aoPos(pos){
 const d=regras.distancia(pos,pet.casa),novo=regras.estado(d,raio,estado);
 trilha.push({lat:pos.lat,lng:pos.lng});trilha=trilha.slice(-300);dados.historico.addPonto(pet.id,{lat:pos.lat,lng:pos.lng});
 if(novo!==estado){const m={atencao:'saiu da área segura.',fuga:'pode ter fugido! Está longe de casa.',seguro:'voltou para a área segura.'}[novo],tipo=novo==='seguro'?'retorno':novo==='fuga'?'fuga':'saida';
  dados.alertas.criar({tipo,petId:pet.id,petNome:pet.nome,mensagem:m});dados.historico.addEvento({petId:pet.id,tipo,distancia:Math.round(d),em:Date.now()});
  ui.toast(pet.nome+' '+m,novo==='seguro'?'ok':'erro');estado=novo;hist();}
 dados.ultima.gravar(pet.id,{lat:pos.lat,lng:pos.lng,estado,distancia:d,em:Date.now()});mostrar(pos);}
async function carregar(id){
 if(sim)sim.parar();pet=pets.find(p=>p.id===id);const cfg=await dados.config.obter();raio=cfg.raios[id]||200;
 const u=await dados.ultima.obter(id);trilha=await dados.historico.trajeto(id);estado=u?u.estado:'seguro';
 sim=new PC.SimuladorGPS({casa:pet.casa,posicao:u&&{lat:u.lat,lng:u.lng},raio,velocidade:cfg.velocidade});
 $('raio').value=raio;$('oRaio').textContent=raio+' m';$('vel').value=cfg.velocidade;
 mapa.enquadrar(pet.casa,raio);mostrar(sim.pos);botoes();hist();}
const rodar=m=>{sim.definirModo(m);if(!sim.ativo())sim.iniciar(aoPos);botoes();};
$('selPet').onchange=e=>carregar(e.target.value);
$('bIniciar').onclick=()=>{sim.ativo()?sim.parar():sim.iniciar(aoPos);botoes();};
$('bFuga').onclick=()=>{rodar('fuga');ui.toast('Fuga simulada iniciada (dados fictícios).','info');};
$('bVolta').onclick=()=>rodar('retorno');
$('bCasa').onclick=async()=>{sim.definirPosicao(pet.casa);sim.definirModo('passeio');trilha=[];estado='seguro';await dados.historico.limparTrajeto(pet.id);mostrar(sim.pos);};
$('bLimpar').onclick=async()=>{await dados.historico.limparEventos(pet.id);hist();};
$('raio').oninput=e=>{raio=+e.target.value;sim.raio=raio;$('oRaio').textContent=raio+' m';mostrar(sim.pos);};
$('raio').onchange=async()=>{const c=await dados.config.obter();await dados.config.salvar({raios:{...c.raios,[pet.id]:raio}});mapa.enquadrar(pet.casa,raio);};
$('vel').onchange=async e=>{sim.vel=+e.target.value;await dados.config.salvar({velocidade:sim.vel});};
carregar(pets[0].id);
})(window.PC);
