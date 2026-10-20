/* Camada de acesso a dados dos animais. Hoje: dados fictícios + LocalStorage. Futuro: trocar o corpo por fetch() à API REST. */
(function(PC){
const A=PC.armazenamento,P=v=>Promise.resolve(v),CASA={lat:-23.5614,lng:-46.6559};
const mk=(id,nome,especie,raca,meses,porte,sexo,descricao,status,casa)=>({id,nome,especie,raca,meses,porte,sexo,descricao,status,tutor:!!casa,casa});
const SEMENTE=[ // todos fictícios
 mk('p1','Bidu','Cachorro','SRD',24,'Médio','Macho','Brincalhão e ótimo com crianças.','disponivel'),
 mk('p2','Luna','Gato','SRD',12,'Pequeno','Fêmea','Calma e adora colo.','disponivel'),
 mk('p3','Pipoca','Cachorro','Poodle mix',48,'Pequeno','Fêmea','Dócil e sociável.','analise'),
 mk('p4','Zeus','Cachorro','Labrador mix',36,'Grande','Macho','Enérgico, precisa de espaço.','disponivel'),
 mk('p5','Simba','Gato','SRD laranja',6,'Pequeno','Macho','Filhote curioso.','disponivel'),
 mk('p6','Tobias','Cachorro','Beagle mix',100,'Médio','Macho','Sênior tranquilo.','disponivel'),
 mk('p7','Thor','Cachorro','Golden mix',36,'Grande','Macho','Adotado (demonstração).','adotado',CASA),
 mk('p8','Mel','Gato','SRD',30,'Pequeno','Fêmea','Adotada (demonstração).','adotado',{lat:-23.5505,lng:-46.6333})];
const ler=()=>{let l=A.ler('pets',null);if(!l){l=SEMENTE;A.gravar('pets',l);}return l;};
// Regra: animal adotado ganha tutor e "casa" fictícia; os demais não são monitorados
const norm=d=>d.status!=='adotado'?{...d,tutor:false}:d.casa?{...d,tutor:true}:{...d,tutor:true,casa:{lat:CASA.lat+(Math.random()-.5)*.004,lng:CASA.lng+(Math.random()-.5)*.004}};
PC.petService={
 listar:()=>P(ler()),obter:id=>P(ler().find(p=>p.id===id)||null),
 criar(d){const p=norm({...d,id:PC.uid()});A.gravar('pets',[...ler(),p]);return P(p);},
 atualizar(id,d){const l=ler().map(p=>p.id===id?norm({...p,...d}):p);A.gravar('pets',l);return P(l.find(p=>p.id===id));},
 remover(id){A.gravar('pets',ler().filter(p=>p.id!==id));return P(true);}};
})(window.PC);
