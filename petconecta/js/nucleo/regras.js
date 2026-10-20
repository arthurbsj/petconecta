/* Regras de negócio do front-end (sem DOM e sem armazenamento). */
(function(PC){
const R=Math.PI/180;
PC.regras={
 // Distância em metros (fórmula de Haversine)
 distancia(a,b){const dl=(b.lat-a.lat)*R,dg=(b.lng-a.lng)*R,x=Math.sin(dl/2)**2+Math.cos(a.lat*R)*Math.cos(b.lat*R)*Math.sin(dg/2)**2;return 12742000*Math.asin(Math.sqrt(x));},
 rumo(a,b){const y=Math.sin((b.lng-a.lng)*R)*Math.cos(b.lat*R),x=Math.cos(a.lat*R)*Math.sin(b.lat*R)-Math.sin(a.lat*R)*Math.cos(b.lat*R)*Math.cos((b.lng-a.lng)*R);return (Math.atan2(y,x)/R+360)%360;},
 // Contato periódico com o tutor: atrasado, vence em até 3 dias (proximo) ou em dia
 statusContato(t,agora=Date.now()){const d=(agora-t.ultimoContato)/864e5;return d>=t.intervaloDias?'atrasado':d>=t.intervaloDias-3?'proximo':'emdia';},
 proximoContato:t=>t.ultimoContato+t.intervaloDias*864e5,
 cardeal:r=>['norte','nordeste','leste','sudeste','sul','sudoeste','oeste','noroeste'][Math.round(r/45)%8],
 // Estado: seguro (dentro do raio), atencao (fora do raio), fuga (além de 1,5x o raio). Histerese de 5% no retorno.
 estado(d,r,ant){if(d>r*1.5)return'fuga';if(d>r)return ant==='fuga'?'fuga':'atencao';return ant&&ant!=='seguro'&&d>r*.95?ant:'seguro';},
 filtrar(pets,f,favs){const q=(f.q||'').toLowerCase(),fx=m=>m<12?'filhote':m<96?'adulto':'senior';
  return pets.filter(p=>(!q||(p.nome+' '+p.raca+' '+p.descricao).toLowerCase().includes(q))&&(!f.especie||p.especie===f.especie)&&(!f.porte||p.porte===f.porte)&&(!f.sexo||p.sexo===f.sexo)&&(!f.idade||fx(p.meses)===f.idade)&&(!f.status||p.status===f.status)&&(!f.fav||favs.includes(p.id)));}
};})(window.PC);
