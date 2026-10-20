/* ==========================================================
   Armazenamento: ÚNICO arquivo que mexe no LocalStorage.
   Os outros arquivos pedem os dados através dos serviços.
   ========================================================== */
(function () {
  const PREFIXO = "petconecta:";
  const memoria = {}; // plano B caso o navegador bloqueie o LocalStorage

  PC.armazenamento = {
    ler(chave, valorPadrao) {
      try {
        const texto = localStorage.getItem(PREFIXO + chave);
        return texto === null ? valorPadrao : JSON.parse(texto);
      } catch (erro) {
        return chave in memoria ? memoria[chave] : valorPadrao;
      }
    },

    gravar(chave, valor) {
      try {
        localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
      } catch (erro) {
        memoria[chave] = valor;
      }
    },

    limparTudo() {
      try {
        Object.keys(localStorage)
          .filter(chave => chave.startsWith(PREFIXO))
          .forEach(chave => localStorage.removeItem(chave));
      } catch (erro) {
        // nada a fazer
      }
    }
  };

  // Gera um identificador simples e único
  PC.novoId = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  };
})();
