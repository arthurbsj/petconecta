/* ==========================================================
   Tela de login FICTÍCIA (uma para o dono e outra para a ONG).
   Enquanto não houver login, o conteúdo da tela fica escondido.
   ========================================================== */
(function () {
  PC.login = {
    // opcoes: { perfil, telaLogin, telaConteudo, aoEntrar }
    //   perfil        "dono" ou "ong"
    //   telaLogin     id do <section> onde aparece o formulário
    //   telaConteudo  id do <div> que fica escondido até o login
    //   aoEntrar      função que inicia a tela depois do login
    async exigir(opcoes) {
      const usuario = await PC.auth.usuarioAtual(opcoes.perfil);
      if (usuario) {
        liberar(opcoes, usuario);
      } else {
        mostrarFormulario(opcoes);
      }
    }
  };

  function mostrarFormulario(opcoes) {
    const exemplo = PC.config.USUARIOS[opcoes.perfil];
    const titulo = opcoes.perfil === "dono" ? "Entrar como dono do pet" : "Entrar como ONG";
    const area = document.getElementById(opcoes.telaLogin);

    area.innerHTML = `
      <form class="login card" novalidate>
        <h2>${titulo}</h2>
        <p class="nota">Login fictício, só para demonstração. Use:<br>
          E-mail: <b>${exemplo.email}</b><br>Senha: <b>${exemplo.senha}</b></p>
        <label>E-mail <input name="email" type="email" autocomplete="off"></label>
        <label>Senha <input name="senha" type="password" autocomplete="off"></label>
        <p class="erro-login" role="alert"></p>
        <button class="btn ouro">Entrar</button>
        <button type="button" class="btn claro" data-preencher>Preencher dados de exemplo</button>
      </form>`;

    const formulario = area.querySelector("form");

    area.querySelector("[data-preencher]").onclick = () => {
      formulario.email.value = exemplo.email;
      formulario.senha.value = exemplo.senha;
    };

    formulario.onsubmit = async evento => {
      evento.preventDefault();
      const usuario = await PC.auth.entrar(opcoes.perfil, formulario.email.value, formulario.senha.value);
      if (usuario) {
        liberar(opcoes, usuario);
      } else {
        area.querySelector(".erro-login").textContent = "E-mail ou senha incorretos.";
      }
    };
  }

  // Esconde o formulário, mostra o conteúdo e a barra "Olá, ... Sair"
  function liberar(opcoes, usuario) {
    const area = document.getElementById(opcoes.telaLogin);
    area.innerHTML = `
      <div class="barra-usuario">
        <span>Olá, <b>${PC.ui.escapar(usuario.nome)}</b></span>
        <button class="btn claro" data-sair>Sair</button>
      </div>`;

    area.querySelector("[data-sair]").onclick = async () => {
      await PC.auth.sair(opcoes.perfil);
      location.reload();
    };

    document.getElementById(opcoes.telaConteudo).hidden = false;
    opcoes.aoEntrar();
  }
})();
