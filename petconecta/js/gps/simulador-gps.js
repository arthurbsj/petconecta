/* Motor do GPS SIMULADO. Não depende de mapa, DOM ou armazenamento.
   Contrato de "fonte de coordenadas": iniciar(cb), parar(), ativo(), definirModo(), definirPosicao().
   Uma fonte real (API/dispositivo) pode implementar o mesmo contrato chamando cb({lat,lng,t}). */
(function(PC){
class SimuladorGPS{
 constructor({casa,posicao,raio,velocidade=1}){this.casa=casa;this.pos=posicao||{...casa};this.raio=raio;this.vel=velocidade;this.modo='passeio';this.rumo=Math.random()*360;this.t=null;}
 iniciar(cb){this.parar();this.cb=cb;this.t=setInterval(()=>this.tick(),1000);}
 parar(){clearInterval(this.t);this.t=null;}
 ativo(){return this.t!==null;}
 definirModo(m){this.modo=m;if(m==='fuga')this.rumo=Math.random()*360;}
 definirPosicao(p){this.pos={lat:p.lat,lng:p.lng};}
 tick(){
  const rg=PC.regras,d=rg.distancia(this.pos,this.casa),passo={passeio:1.4,fuga:4,retorno:4,parado:0}[this.modo]*this.vel; // metros neste segundo
  let chegou=false;
  if(this.modo==='fuga')this.rumo+=(Math.random()-.5)*20;
  else if(this.modo==='retorno'){this.rumo=rg.rumo(this.pos,this.casa);if(d<=passo){this.pos={...this.casa};this.modo='passeio';chegou=true;}}
  else if(this.modo==='passeio')this.rumo=d>this.raio*.6?rg.rumo(this.pos,this.casa):this.rumo+(Math.random()-.5)*60;
  if(!chegou){const r=this.rumo*Math.PI/180;this.pos={lat:this.pos.lat+passo*Math.cos(r)/111320,lng:this.pos.lng+passo*Math.sin(r)/(111320*Math.cos(this.pos.lat*Math.PI/180))};}
  this.cb({...this.pos,t:Date.now(),modo:this.modo});
 }}
PC.SimuladorGPS=SimuladorGPS;})(window.PC);
