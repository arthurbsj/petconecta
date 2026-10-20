/* Componente visual do mapa (Leaflet + OpenStreetMap). Apenas desenha; não gera coordenadas. */
(function(PC){
class Mapa{
 constructor(id){const el=document.getElementById(id);this.ok=!!window.L;
  if(!this.ok){el.textContent='Não foi possível carregar o mapa (Leaflet/OpenStreetMap). Verifique a conexão com a internet.';return;}
  this.m=L.map(id).setView([-23.55,-46.63],16);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(this.m);
  this.c=L.circle([0,0],{color:'#c9a24b',fillOpacity:.12}).addTo(this.m);
  this.rota=L.polyline([],{color:'#0e1f3d',weight:3}).addTo(this.m);
  this.casa=L.marker([0,0],{title:'Casa (fictícia)'}).addTo(this.m);
  this.pet=L.circleMarker([0,0],{radius:9,color:'#fff',weight:2,fillOpacity:1}).addTo(this.m);}
 enquadrar(casa,raio){if(this.ok)this.m.fitBounds(L.circle([casa.lat,casa.lng],{radius:raio*1.8}).getBounds());}
 atualizar(casa,raio,pos,trilha,cor){if(!this.ok)return;const ll=[pos.lat,pos.lng];
  this.c.setLatLng([casa.lat,casa.lng]).setRadius(raio);this.casa.setLatLng([casa.lat,casa.lng]);
  this.pet.setLatLng(ll).setStyle({fillColor:cor});this.rota.setLatLngs(trilha.map(p=>[p.lat,p.lng]));
  if(!this.m.getBounds().contains(ll))this.m.fitBounds(L.latLngBounds([ll,[casa.lat,casa.lng]]).pad(.3));}}
PC.Mapa=Mapa;})(window.PC);
