/* ==========================================================
   Login FICTÍCIO (só para demonstração).
   Compara e-mail e senha com js/config.js e guarda a sessão no navegador.
   Não protege nada de verdade: a autenticação real será feita no back-end.
   Existem dois perfis separados: "dono" e "ong".
   ========================================================== */
(function () {
  const A = PC.armazenamento;

  PC.auth = {
    // Devolve o usuário se os dados estiverem certos, ou null
    entrar(perfil, email, senha) {
      const usuario = PC.config.USUARIOS[perfil];
      const acertou = usuario &&
        email.trim().toLowerCase() === usuario.email &&
        senha === usuario.senha;

      if (!acertou) {
        return Promise.resolve(null);
      }

      const sessoes = A.ler("sessoes", {});
      sessoes[perfil] = { nome: usuario.nome, email: usuario.email };
      A.gravar("sessoes", sessoes);
      return Promise.resolve(sessoes[perfil]);
    },

    usuarioAtual(perfil) {
      const sessoes = A.ler("sessoes", {});
      return Promise.resolve(sessoes[perfil] || null);
    },

    sair(perfil) {
      const sessoes = A.ler("sessoes", {});
      delete sessoes[perfil];
      A.gravar("sessoes", sessoes);
      return Promise.resolve(true);
    }
  };
})();
