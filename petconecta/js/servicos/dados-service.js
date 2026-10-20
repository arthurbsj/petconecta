/* Serviços DEMONSTRATIVOS (LocalStorage). Todos retornam Promises para permitir trocar por fetch() à API depois. */
(function(PC){
const A=PC.armazenamento,P=v=>Promise.resolve(v),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const aviso=()=>document.dispatchEvent(new Event('alertas:mudou'));
const por=(k,f)=>{const o=A.ler(k,{});f(o);A.gravar(k,o);};
PC.uid=uid;
const DIA=864e5;
const tut=()=>{let o=A.ler('tutores',null);if(!o){const h=Date.now();o={ // tutores FICTÍCIOS
 p7:{nome:'Ana Souza (fictícia)',telefone:'(11) 90000-0001',email:'ana@exemplo.com',moradia:'Casa',intervaloDias:30,ultimoContato:h-40*DIA,ultimoAlerta:0,contatos:[{em:h-40*DIA,canal:'Telefone',situacao:'bem',obs:'Adaptação ótima (exemplo).'}]},
 p8:{nome:'Carlos Lima (fictício)',telefone:'(11) 90000-0002',email:'carlos@exemplo.com',moradia:'Apartamento',intervaloDias:15,ultimoContato:h-5*DIA,ultimoAlerta:0,contatos:[]}};A.gravar('tutores',o);}return o;};
const salvT=f=>{const o=tut();f(o);A.gravar('tutores',o);};
PC.dados={
 favoritos:{listar:()=>P(A.ler('favoritos',[])),alternar(id){const f=A.ler('favoritos',[]),i=f.indexOf(id);i<0?f.push(id):f.splice(i,1);A.gravar('favoritos',f);return P(f);}},
 config:{obter:()=>P({raios:{},velocidade:1,...A.ler('config',{})}),salvar(p){const c={raios:{},velocidade:1,...A.ler('config',{}),...p};A.gravar('config',c);return P(c);}},
 solicitacoes:{listar:()=>P(A.ler('solicitacoes',[])),criar(s){const l=A.ler('solicitacoes',[]);s={...s,id:uid(),status:'pendente',em:Date.now()};l.unshift(s);A.gravar('solicitacoes',l);return P(s);},
  atualizar(id,st){A.gravar('solicitacoes',A.ler('solicitacoes',[]).map(x=>x.id===id?{...x,status:st}:x));return P(true);}},
 alertas:{listar:()=>P(A.ler('alertas',[])),criar(a){const l=A.ler('alertas',[]);l.unshift({...a,id:uid(),em:Date.now(),lida:false});A.gravar('alertas',l.slice(0,50));aviso();return P(true);},
  marcarLidas(){A.gravar('alertas',A.ler('alertas',[]).map(a=>({...a,lida:true})));aviso();return P(true);}},
 historico:{trajeto:id=>P(A.ler('trajetos',{})[id]||[]),addPonto:(id,p)=>{por('trajetos',o=>{o[id]=[...(o[id]||[]),p].slice(-300);});return P(true);},
  limparTrajeto:id=>{por('trajetos',o=>{o[id]=[];});return P(true);},
  eventos:id=>P(A.ler('eventos',[]).filter(e=>!id||e.petId===id)),addEvento(e){A.gravar('eventos',[e,...A.ler('eventos',[])].slice(0,100));return P(true);},
  limparEventos(id){A.gravar('eventos',A.ler('eventos',[]).filter(e=>e.petId!==id));return P(true);}},
 acompanhamento:{ // tutores e contatos periódicos
  listar:()=>P(tut()),
  salvar(id,d){salvT(o=>{o[id]={intervaloDias:30,ultimoContato:Date.now(),ultimoAlerta:0,contatos:[],...o[id],...d};});return P(true);},
  registrarContato(id,c){salvT(o=>{o[id].contatos=[{...c,em:Date.now()},...o[id].contatos];o[id].ultimoContato=Date.now();o[id].ultimoAlerta=0;});return P(true);},
  remover(id){salvT(o=>{delete o[id];});return P(true);},
  // Gera 1 alerta por dia para cada contato atrasado (roda ao abrir qualquer página)
  async verificar(){const o=tut(),pets=await PC.petService.listar(),hoje=Math.floor(Date.now()/DIA);let n=0;
   for(const id in o){const t=o[id],p=pets.find(x=>x.id===id);if(!p||PC.regras.statusContato(t)!=='atrasado'||t.ultimoAlerta===hoje)continue;
    t.ultimoAlerta=hoje;n++;await PC.dados.alertas.criar({tipo:'contato',petId:id,petNome:p.nome,mensagem:'– hora de contatar o tutor ('+t.nome+'): último contato há '+Math.floor((Date.now()-t.ultimoContato)/DIA)+' dias.'});}
   if(n)A.gravar('tutores',o);}},
 atividades:{listar:()=>P(A.ler('atividades',[])),registrar(texto){A.gravar('atividades',[{texto,em:Date.now()},...A.ler('atividades',[])].slice(0,30));return P(true);}},
 ultima:{obter:id=>P(A.ler('ultima',{})[id]||null),gravar:(id,p)=>{por('ultima',o=>{o[id]=p;});return P(true);}}
};})(window.PC);
