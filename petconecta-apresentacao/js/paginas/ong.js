/* ==========================================================
   Tela "Área da ONG": indicadores, solicitações de adoção, atividades,
   acompanhamento pós-adoção, tutores e cadastro/edição/exclusão de animais.
   ========================================================== */
PC.paginas.ong = async function () {
  const { dados, ui } = PC;
  const $ = id => document.getElementById(id);
  const esc = ui.escapar;

  const TEXTO_STATUS = { disponivel: "Disponível", analise: "Em análise", adotado: "Adotado" };
  const TEXTO_GPS = { seguro: "seguro", atencao: "fora do raio", fuga: "POSSÍVEL FUGA" };
  let pets = [];

  // Busca os dados e redesenha a tela inteira
  async function carregar() {
    pets = await PC.petService.listar();
    await PC.tutorService.sincronizar();

    const solicitacoes = await dados.solicitacoes.listar();
    const atividades = await dados.atividades.listar();
    const tutores = await PC.tutorService.listar();
    const adotados = pets.filter(p => p.tutor);
    const leituras = await Promise.all(adotados.map(async p => ({ pet: p, ultima: await dados.ultimaPosicao.obter(p.id) })));
    const pendentes = solicitacoes.filter(s => s.status === "pendente");

    desenharIndicadores(pendentes, leituras, tutores);
    desenharSolicitacoes(pendentes);
    desenharAtividades(atividades);
    desenharAcompanhamento(leituras);
    desenharTabelaDeAnimais();
    await PC.tutoresOng.desenhar();
  }

  /* ---------- Blocos da tela ---------- */
  function desenharIndicadores(pendentes, leituras, tutores) {
    const contar = status => pets.filter(p => p.status === status).length;
    const atrasados = pets.filter(p => p.status === "adotado" && tutores[p.id] &&
      PC.tutorService.situacao(tutores[p.id]) === "atrasado").length;
    const emFuga = leituras.filter(l => l.ultima && l.ultima.estado === "fuga").length;

    const indicadores = [
      ["Animais", pets.length],
      ["Disponíveis", contar("disponivel")],
      ["Em análise", contar("analise")],
      ["Adotados", contar("adotado")],
      ["Solicitações pendentes", pendentes.length],
      ["Contatos atrasados", atrasados],
      ["Em fuga agora", emFuga]
    ];

    $("indicadores").innerHTML = indicadores.map(([nome, valor]) =>
      `<div class="card indicador"><b>${valor}</b>${nome}</div>`).join("");
  }

  function desenharSolicitacoes(pendentes) {
    $("solicitacoes").innerHTML = pendentes.map(s => `
      <li>
        <b>${esc(s.nome)}</b> quer adotar <b>${esc(s.petNome)}</b> (${esc(s.moradia)}, ${esc(s.email)})
        <div class="botoes">
          <button class="btn" data-acao="aprovar" data-id="${s.id}" data-pet="${s.petId}">Aprovar</button>
          <button class="btn claro" data-acao="recusar" data-id="${s.id}" data-pet="${s.petId}">Recusar</button>
        </div>
      </li>`).join("") || "<li>Nenhuma solicitação pendente.</li>";
  }

  function desenharAtividades(atividades) {
    $("atividades").innerHTML = atividades.slice(0, 8).map(a =>
      `<li>${new Date(a.em).toLocaleString("pt-BR")} - ${esc(a.texto)}</li>`
    ).join("") || "<li>Sem atividades.</li>";
  }

  // Última leitura do GPS simulado de cada pet adotado
  function desenharAcompanhamento(leituras) {
    $("acompanhamento").innerHTML = leituras.map(({ pet, ultima }) => {
      const situacao = ultima
        ? `${TEXTO_GPS[ultima.estado]}, ${Math.round(ultima.distancia)} m de casa (${new Date(ultima.em).toLocaleTimeString("pt-BR")})`
        : "sem leituras - inicie o simulador em Meu Pet";
      return `<li><b>${esc(pet.nome)}</b>: ${situacao}</li>`;
    }).join("") || "<li>Nenhum animal adotado.</li>";
  }

  function desenharTabelaDeAnimais() {
    $("tabelaAnimais").innerHTML = pets.map(pet => `
      <tr>
        <td>${esc(pet.nome)}</td>
        <td>${pet.especie}</td>
        <td>${esc(pet.raca)}</td>
        <td>${ui.formatarIdade(pet.meses)}</td>
        <td>${TEXTO_STATUS[pet.status]}</td>
        <td>
          <button class="btn claro" data-acao="editar" data-id="${pet.id}">Editar</button>
          <button class="btn perigo" data-acao="excluir" data-id="${pet.id}">Excluir</button>
        </td>
      </tr>`).join("");
  }

  /* ---------- Cadastro e edição de animais ---------- */
  function abrirFormularioDoAnimal(pet) {
    const p = pet || {};
    const situacoes = Object.entries(TEXTO_STATUS)
      .map(([valor, texto]) => `<option value="${valor}" ${p.status === valor ? "selected" : ""}>${texto}</option>`).join("");

    const janela = ui.abrirModal(pet ? "Editar animal" : "Cadastrar animal", `
      <form id="formAnimal">
        <label>Nome <input name="nome" value="${esc(p.nome)}"></label>
        <label>Espécie <select name="especie">${ui.opcoes(["Cachorro", "Gato"], p.especie)}</select></label>
        <label>Raça <input name="raca" value="${esc(pet ? p.raca : "SRD")}"></label>
        <label>Idade em meses <input name="meses" type="number" min="0" max="300" value="${pet ? p.meses : 12}"></label>
        <label>Porte <select name="porte">${ui.opcoes(["Pequeno", "Médio", "Grande"], p.porte)}</select></label>
        <label>Sexo <select name="sexo">${ui.opcoes(["Macho", "Fêmea"], p.sexo)}</select></label>
        <label>Descrição <textarea name="descricao" rows="2">${esc(p.descricao)}</textarea></label>
        <label>Situação <select name="status">${situacoes}</select></label>
        <button class="btn ouro">Salvar</button>
      </form>`);

    janela.querySelector("#formAnimal").onsubmit = async evento => {
      evento.preventDefault();
      const campos = Object.fromEntries(new FormData(evento.target));
      campos.meses = Number(campos.meses);

      if (!campos.nome.trim()) {
        ui.avisar("Informe o nome do animal.", "erro");
        return;
      }

      if (pet) {
        await PC.petService.atualizar(pet.id, campos);
      } else {
        await PC.petService.criar(campos);
      }
      await dados.atividades.registrar((pet ? "Animal atualizado: " : "Animal cadastrado: ") + campos.nome);

      janela.fecharJanela();
      ui.avisar("Animal salvo.");
      carregar();
    };
  }

  /* ---------- Botões da tela ---------- */
  $("botaoNovoAnimal").onclick = () => abrirFormularioDoAnimal(null);

  $("tabelaAnimais").onclick = async evento => {
    const botao = evento.target.closest("button");
    if (!botao) return;

    const pet = pets.find(p => p.id === botao.dataset.id);

    if (botao.dataset.acao === "editar") {
      abrirFormularioDoAnimal(pet);
    } else if (confirm("Excluir " + pet.nome + "?")) {
      await PC.petService.remover(pet.id);
      await PC.tutorService.remover(pet.id);
      await dados.atividades.registrar("Animal excluído: " + pet.nome);
      ui.avisar("Animal excluído.");
      carregar();
    }
  };

  // Aprovar vira "adotado" (e cria o tutor); recusar devolve o animal ao catálogo
  $("solicitacoes").onclick = async evento => {
    const botao = evento.target.closest("button");
    if (!botao) return;

    const aprovou = (botao.dataset.acao === "aprovar");
    await dados.solicitacoes.atualizarStatus(botao.dataset.id, aprovou ? "aprovada" : "recusada");
    await PC.petService.atualizar(botao.dataset.pet, { status: aprovou ? "adotado" : "disponivel" });
    await dados.atividades.registrar("Solicitação " + (aprovou ? "aprovada" : "recusada"));

    ui.avisar(aprovou ? "Adoção aprovada: o pet já aparece em Meu Pet." : "Solicitação recusada.");
    carregar();
  };

  carregar();
};
