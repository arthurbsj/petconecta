/* ==========================================================
   Tela "Catálogo de Adoção" (pública): busca, filtros, favoritos
   e formulário de interesse em adotar.
   ========================================================== */
PC.paginas.catalogo = async function () {
  const { dados, regras, ui } = PC;
  const $ = id => document.getElementById(id);

  const TEXTO_STATUS = { disponivel: "Disponível", analise: "Em análise", adotado: "Adotado" };
  let pets = [];
  let favoritos = [];

  async function carregar() {
    pets = await PC.petService.listar();
    favoritos = await dados.favoritos.listar();
    desenharLista();
  }

  // Lê os campos de filtro da tela
  function lerFiltros() {
    return {
      busca: $("busca").value,
      especie: $("especie").value,
      porte: $("porte").value,
      sexo: $("sexo").value,
      idade: $("idade").value,
      status: $("situacao").value,
      soFavoritos: $("soFavoritos").checked
    };
  }

  function desenharLista() {
    const lista = regras.filtrarPets(pets, lerFiltros(), favoritos);
    $("quantidade").textContent = lista.length + " animal(is) encontrado(s)";

    $("lista").innerHTML = lista.map(pet => `
      <article class="card">
        ${ui.fotoDoPet(pet)}
        <button class="favorito" data-acao="favoritar" data-id="${pet.id}"
                aria-label="Favoritar ${ui.escapar(pet.nome)}">${favoritos.includes(pet.id) ? "❤️" : "🤍"}</button>
        <h3>${ui.escapar(pet.nome)}</h3>
        <p>
          <span class="etiqueta">${pet.especie}</span>
          <span class="etiqueta">${pet.porte}</span>
          <span class="etiqueta">${pet.sexo}</span>
          <span class="etiqueta">${ui.formatarIdade(pet.meses)}</span>
        </p>
        <p>${ui.escapar(pet.raca)} · ${TEXTO_STATUS[pet.status]}</p>
        <div class="botoes">
          <button class="btn claro" data-acao="detalhes" data-id="${pet.id}">Detalhes</button>
          <button class="btn ouro" data-acao="adotar" data-id="${pet.id}"
                  ${pet.status !== "disponivel" ? "disabled" : ""}>Quero adotar</button>
        </div>
      </article>`
    ).join("") || '<div class="card">Nenhum animal com esses filtros. Limpe os filtros para ver todos.</div>';
  }

  function mostrarDetalhes(pet) {
    ui.abrirModal(pet.nome, `
      ${ui.fotoDoPet(pet)}
      <p>${ui.escapar(pet.raca)} · ${ui.formatarIdade(pet.meses)} · ${pet.porte} · ${pet.sexo}</p>
      <p>${ui.escapar(pet.descricao)}</p>`);
  }

  // Formulário de interesse (demonstrativo: nada é enviado para fora)
  function abrirFormularioDeInteresse(pet) {
    const janela = ui.abrirModal("Quero adotar " + pet.nome, `
      <form id="formInteresse" novalidate>
        <label>Nome completo <input name="nome"></label>
        <label>E-mail <input name="email" type="email"></label>
        <label>Telefone <input name="telefone"></label>
        <label>Moradia
          <select name="moradia"><option>Casa</option><option>Apartamento</option></select>
        </label>
        <label>Por que deseja adotar? <textarea name="mensagem" rows="3"></textarea></label>
        <p class="nota">Formulário demonstrativo: nada é enviado a uma ONG real.</p>
        <button class="btn ouro">Enviar interesse</button>
      </form>`);

    janela.querySelector("#formInteresse").onsubmit = async evento => {
      evento.preventDefault();
      const campos = Object.fromEntries(new FormData(evento.target));

      const emailValido = /^\S+@\S+\.\S+$/.test(campos.email);
      if (!campos.nome.trim() || !emailValido || campos.telefone.trim().length < 8) {
        ui.avisar("Informe nome, e-mail válido e telefone.", "erro");
        return;
      }

      await dados.solicitacoes.criar({ ...campos, petId: pet.id, petNome: pet.nome });
      await PC.petService.atualizar(pet.id, { status: "analise" });
      await dados.atividades.registrar("Novo interesse em adotar " + pet.nome);

      janela.fecharJanela();
      ui.avisar("Interesse registrado!");
      carregar();
    };
  }

  // Um único "ouvinte" trata os botões de todos os cartões
  $("lista").onclick = async evento => {
    const botao = evento.target.closest("button");
    if (!botao || botao.disabled) return;

    const pet = pets.find(p => p.id === botao.dataset.id);
    const acao = botao.dataset.acao;

    if (acao === "favoritar") {
      favoritos = await dados.favoritos.alternar(pet.id);
      desenharLista();
    } else if (acao === "detalhes") {
      mostrarDetalhes(pet);
    } else {
      abrirFormularioDeInteresse(pet);
    }
  };

  // Qualquer mudança nos filtros redesenha a lista
  ["busca", "especie", "porte", "sexo", "idade", "situacao", "soFavoritos"].forEach(id => {
    $(id).oninput = desenharLista;
  });

  $("limparFiltros").onclick = () => {
    ["busca", "especie", "porte", "sexo", "idade"].forEach(id => { $(id).value = ""; });
    $("situacao").value = "disponivel";
    $("soFavoritos").checked = false;
    desenharLista();
  };

  carregar();
};
