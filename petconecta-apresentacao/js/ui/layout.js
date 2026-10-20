/* ==========================================================
   Layout comum: cabeçalho, menu, sino de notificações, rodapé.
   Funciona em dois modos:
   - "apresentacao": as 3 telas ficam na mesma página (menu troca a tela)
   - "meu", "catalogo" ou "ong": cada tela é uma página separada
   ========================================================== */
(function () {
  const ui = () => PC.ui;

  // Quais alertas cada tela mostra no sino (o catálogo é público e não tem sino)
  const ALERTAS_DA_TELA = {
    meu: ["saida", "fuga", "retorno"],
    ong: ["contato", "fuga"],
    catalogo: []
  };

  const MENU = [
    { tela: "meu",      texto: "Meu Pet",            arquivo: "index.html" },
    { tela: "catalogo", texto: "Catálogo de Adoção", arquivo: "catalogo.html" },
    { tela: "ong",      texto: "Área da ONG",        arquivo: "ong.html" }
  ];

  PC.layout = {
    telaAtual: "meu",

    montar(pagina) {
      const emUmaPagina = (pagina === "apresentacao");

      const links = MENU.map(item => {
        const destino = emUmaPagina ? "#" + item.tela : item.arquivo;
        return `<a href="${destino}" data-tela="${item.tela}">${item.texto}</a>`;
      }).join("");

      const topo = document.getElementById("topo");
      topo.innerHTML = `
        <span class="logo">🐾 PetConecta</span>
        <nav>${links}</nav>
        <div class="sino">
          <button id="botaoSino" aria-label="Notificações">🔔<b id="contadorSino" hidden></b></button>
          <div id="listaSino" class="lista-sino" hidden></div>
        </div>`;

      topo.insertAdjacentHTML("afterend",
        '<div class="aviso-demo">Modo demonstração: dados fictícios salvos só neste navegador. Nenhum rastreador real está conectado.</div>');

      document.querySelector("footer").innerHTML =
        '<button id="botaoRestaurar" class="btn claro">Restaurar dados de demonstração</button>';
      document.getElementById("botaoRestaurar").onclick = () => {
        if (confirm("Apagar todos os dados de demonstração e recomeçar?")) {
          PC.armazenamento.limparTudo();
          location.reload();
        }
      };

      document.getElementById("botaoSino").onclick = () => {
        const lista = document.getElementById("listaSino");
        lista.hidden = !lista.hidden;
      };
      document.addEventListener("alertas:mudou", () => PC.layout.atualizarSino());

      if (emUmaPagina) {
        window.addEventListener("hashchange", () => PC.layout.mostrarTela(location.hash.slice(1)));
        PC.layout.mostrarTela(location.hash.slice(1));
      } else {
        PC.layout.mostrarTela(pagina);
      }
    },

    // Mostra uma tela (no modo de uma página só) e marca o item do menu
    mostrarTela(tela) {
      if (!ALERTAS_DA_TELA[tela]) tela = "meu";
      PC.layout.telaAtual = tela;

      document.querySelectorAll(".tela").forEach(secao => {
        secao.hidden = (secao.id !== "tela-" + tela);
      });
      document.querySelectorAll("nav a").forEach(link => {
        link.classList.toggle("on", link.dataset.tela === tela);
      });

      PC.layout.atualizarSino();
      document.dispatchEvent(new CustomEvent("tela:mostrada", { detail: tela }));
    },

    // Redesenha o sino com os alertas da tela atual
    async atualizarSino() {
      const tela = PC.layout.telaAtual;
      const tipos = ALERTAS_DA_TELA[tela];
      const todos = await PC.dados.alertas.listar();
      const alertas = todos.filter(a => tipos.includes(a.tipo));
      const naoLidas = alertas.filter(a => !a.lida).length;

      document.getElementById("botaoSino").hidden = (tela === "catalogo");
      document.getElementById("contadorSino").hidden = (naoLidas === 0);
      document.getElementById("contadorSino").textContent = naoLidas;

      const itens = alertas.slice(0, 8).map(a => `
        <p class="${a.tipo}">
          <b>${ui().escapar(a.petNome)}</b> ${ui().escapar(a.mensagem)}<br>
          <small>${new Date(a.em).toLocaleString("pt-BR")}</small>
        </p>`).join("");

      const lista = document.getElementById("listaSino");
      lista.innerHTML = (itens || "<p>Nenhum alerta ainda.</p>") +
        '<button class="btn claro" id="botaoLidas">Marcar como lidas</button>';
      document.getElementById("botaoLidas").onclick = () => PC.dados.alertas.marcarTodasLidas();
    }
  };
})();
