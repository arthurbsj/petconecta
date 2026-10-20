/* ÚNICO ponto de acesso ao LocalStorage. Os demais arquivos usam os serviços. */
(function(PC){
const P='petconecta:',mem={};
PC.armazenamento={
 ler(k,pad){try{const v=localStorage.getItem(P+k);return v===null?pad:JSON.parse(v);}catch(e){return k in mem?mem[k]:pad;}},
 gravar(k,v){try{localStorage.setItem(P+k,JSON.stringify(v));}catch(e){mem[k]=v;}},
 limparTudo(){try{Object.keys(localStorage).filter(k=>k.startsWith(P)).forEach(k=>localStorage.removeItem(k));}catch(e){}}
};})(window.PC=window.PC||{});
