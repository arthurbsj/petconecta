/* ==========================================================
   Parte da Área da ONG: tutores e contatos periódicos.
   Mostra os dados dos tutores, avisa quando o contato está atrasado
   e permite registrar como o animal está. (Usado por ong.js)
   ========================================================== */
PC.tutoresOng = (function () {
  const ui = PC.ui;
  const esc = ui.escapar;
  const $ = id => document.getElementById(id);

  const SITUACAO_DO_ANIMAL = { bem: "Está bem", atencao: "Precisa de atenção", problema: "Com problema" };
  const TEXTO_PRAZO = { emdia: "Em dia", proximo: "Vence em breve", atrasado: "Atrasado" };
  const formatarData = tempo => new Date(tempo).toLocaleDateString("pt-BR");

  let pets = [];
  let tutores = {};

  // Desenha a tabela (chamado por ong.js sempre que os dados mudam)
  async function desenhar() {
    await PC.tutorService.sincronizar();
    pets = await PC.petService.listar();
    tutores = await PC.tutorService.listar();

    const adotados = pets.filter(p => p.status === "adotado");
    const atrasados = adotados.filter(p => tutores[p.id] && PC.tutorService.situacao(tutores[p.id]) === "atrasado").length;

    $("tutAtrasados").hidden = (atrasados === 0);
    $("tutAtrasados").textContent = atrasados + " atrasado(s)";

    $("tabelaTutores").innerHTML = adotados.map(linhaDoTutor).join("") ||
      '<tr><td colspan="6">Nenhum animal adotado.</td></tr>';
  }

  function linhaDoTutor(pet) {
    const tutor = tutores[pet.id];

    if (!tutor) {
      return `
        <tr>
          <td>${esc(pet.nome)}</td>
          <td colspan="4">Sem dados do tutor.</td>
          <td><button class="btn" data-acao="editar" data-id="${pet.id}">Cadastrar tutor</button></td>
        </tr>`;
    }

    const prazo = PC.tutorService.situacao(tutor);
    const ultimo = tutor.contatos[0];
    const telefone = tutor.telefone.replace(/\D/g, "");

    return `
      <tr>
        <td>${esc(pet.nome)}</td>
        <td>${esc(tutor.nome)}<br><small>${esc(tutor.telefone)} · ${esc(tutor.email)} · ${esc(tutor.moradia)}</small></td>
        <td>${tutor.intervaloDias} dias</td>
        <td>${formatarData(tutor.ultimoContato)}${ultimo ? "<br><small>" + SITUACAO_DO_ANIMAL[ultimo.situacao] + "</small>" : ""}</td>
        <td>${formatarData(PC.tutorService.proximoContato(tutor))}<br><span class="selo ${prazo}">${TEXTO_PRAZO[prazo]}</span></td>
        <td>
          <div class="botoes">
            <button class="btn ouro" data-acao="contato" data-id="${pet.id}">Registrar contato</button>
            <a class="btn claro" target="_blank" rel="noopener" href="https://wa.me/55${telefone}">WhatsApp</a>
            <button class="btn claro" data-acao="editar" data-id="${pet.id}">Editar tutor</button>
            <button class="btn claro" data-acao="historico" data-id="${pet.id}">Histórico</button>
          </div>
        </td>
      </tr>`;
  }

  // Janela para cadastrar/editar o tutor e o intervalo de contato (X dias)
  function abrirFormularioDoTutor(pet) {
    const tutor = tutores[pet.id] || {};
    const janela = ui.abrirModal("Tutor de " + pet.nome, `
      <form id="formTutor">
        <label>Nome do tutor <input name="nome" value="${esc(tutor.nome)}"></label>
        <label>Telefone <input name="telefone" value="${esc(tutor.telefone)}"></label>
        <label>E-mail <input name="email" type="email" value="${esc(tutor.email)}"></label>
        <label>Moradia <select name="moradia">${ui.opcoes(["Casa", "Apartamento"], tutor.moradia)}</select></label>
        <label>Contatar a cada (dias)
          <input name="intervaloDias" type="number" min="1" max="365" value="${tutor.intervaloDias || 30}">
        </label>
        <p class="nota">Dados de exemplo: não use dados pessoais reais nesta demonstração.</p>
        <button class="btn ouro">Salvar</button>
      </form>`);

    janela.querySelector("#formTutor").onsubmit = async evento => {
      evento.preventDefault();
      const campos = Object.fromEntries(new FormData(evento.target));
      campos.intervaloDias = Number(campos.intervaloDias);

      const intervaloValido = campos.intervaloDias >= 1 && campos.intervaloDias <= 365;
      if (!campos.nome.trim() || campos.telefone.trim().length < 8 || !intervaloValido) {
        ui.avisar("Informe nome, telefone e um intervalo entre 1 e 365 dias.", "erro");
        return;
      }

      await PC.tutorService.salvar(pet.id, campos);
      await PC.dados.atividades.registrar("Dados do tutor salvos: " + pet.nome);
      janela.fecharJanela();
      ui.avisar("Tutor salvo.");
      desenhar();
    };
  }

  // Janela para registrar um contato (como está o animal?)
  function abrirFormularioDeContato(pet) {
    const situacoes = Object.entries(SITUACAO_DO_ANIMAL)
      .map(([valor, texto]) => `<option value="${valor}">${texto}</option>`).join("");

    const janela = ui.abrirModal("Registrar contato - " + pet.nome, `
      <form id="formContato">
        <label>Canal <select name="canal">${ui.opcoes(["Telefone", "WhatsApp", "E-mail", "Visita"])}</select></label>
        <label>Como está o animal? <select name="situacao">${situacoes}</select></label>
        <label>Observações
          <textarea name="obs" rows="3" placeholder="Alimentação, saúde, adaptação, vacinas..."></textarea>
        </label>
        <button class="btn ouro">Salvar contato</button>
      </form>`);

    janela.querySelector("#formContato").onsubmit = async evento => {
      evento.preventDefault();
      const campos = Object.fromEntries(new FormData(evento.target));

      await PC.tutorService.registrarContato(pet.id, campos);
      await PC.dados.atividades.registrar(
        "Contato com tutor de " + pet.nome + " (" + SITUACAO_DO_ANIMAL[campos.situacao] + ")");
      janela.fecharJanela();
      ui.avisar("Contato registrado. Prazo reiniciado.");
      desenhar();
    };
  }

  function mostrarHistoricoDeContatos(pet) {
    const itens = tutores[pet.id].contatos.map(c => `
      <li>${formatarData(c.em)} · ${esc(c.canal)} · <b>${SITUACAO_DO_ANIMAL[c.situacao]}</b><br>${esc(c.obs)}</li>`
    ).join("") || "<li>Nenhum contato registrado.</li>";

    ui.abrirModal("Histórico - " + pet.nome, `<ul class="lista">${itens}</ul>`);
  }

  // Botões da tabela
  document.addEventListener("click", evento => {
    const botao = evento.target.closest("#tabelaTutores button");
    if (!botao) return;

    const pet = pets.find(p => p.id === botao.dataset.id);
    const acao = botao.dataset.acao;

    if (acao === "editar") abrirFormularioDoTutor(pet);
    else if (acao === "contato") abrirFormularioDeContato(pet);
    else mostrarHistoricoDeContatos(pet);
  });

  return { desenhar };
})();
