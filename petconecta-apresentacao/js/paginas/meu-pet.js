/* ==========================================================
   Tela "Meu Pet" (área do dono): mapa, GPS simulado e alertas.
   Fluxo: o simulador gera uma posição -> receberPosicao() calcula a distância,
   decide o estado (seguro/atenção/fuga), cria alertas e atualiza a tela.
   ========================================================== */
PC.paginas.meu = async function () {
  const { dados, regras, ui } = PC;
  const $ = id => document.getElementById(id);

  const COR_DO_ESTADO = { seguro: "#2e8b57", atencao: "#d98e04", fuga: "#c0392b" };
  const TEXTO_DO_ESTADO = {
    seguro: "Dentro da área segura",
    atencao: "Fora do raio de segurança",
    fuga: "Possível fuga detectada"
  };
  const TEXTO_DO_MODO = { passeio: "Passeio", fuga: "Fuga simulada", retorno: "Retornando", parado: "Parado" };

  // Só pets adotados são monitorados
  const pets = (await PC.petService.listar()).filter(p => p.tutor);
  if (pets.length === 0) {
    $("conteudo-meu").innerHTML =
      '<div class="card">Nenhum pet adotado ainda. Aprove uma adoção na Área da ONG.</div>';
    return;
  }

  // Estado atual da tela
  let pet, raio, simulador;
  let estado = "seguro";
  let trilha = [];

  // O mapa carrega em segundo plano: a tela funciona mesmo se ele demorar
  const mapa = new PC.Mapa("mapa");
  mapa.iniciar();

  $("selPet").innerHTML = pets.map(p => `<option value="${p.id}">${ui.escapar(p.nome)}</option>`).join("");

  /* ---------- Desenho da tela ---------- */
  function mostrarSituacao(posicao) {
    const distancia = regras.distancia(posicao, pet.casa);
    const direcao = regras.nomeDoRumo(regras.rumo(pet.casa, posicao));
    const minutosAPe = Math.max(1, Math.round(distancia / 80));

    $("estado").textContent = TEXTO_DO_ESTADO[estado];
    $("estado").className = "selo " + estado;

    $("metricas").innerHTML = `
      <dt>Distância de casa</dt><dd>${Math.round(distancia)} m</dd>
      <dt>Raio de segurança</dt><dd>${raio} m</dd>
      <dt>Modo</dt><dd>${TEXTO_DO_MODO[simulador.modo]}</dd>
      <dt>Coordenadas</dt><dd>${posicao.lat.toFixed(5)}, ${posicao.lng.toFixed(5)}</dd>`;

    // "Como chegar": abre a rota a pé no Google Maps até a posição do pet
    const rota = `https://www.google.com/maps/dir/?api=1&destination=${posicao.lat},${posicao.lng}&travelmode=walking`;
    $("chegar").innerHTML = `
      <h3>Como chegar</h3>
      <p>${Math.round(distancia)} m a ${direcao} de casa. A pé: cerca de ${minutosAPe} min.</p>
      <a class="btn ouro" target="_blank" rel="noopener" href="${rota}">Abrir rota no Google Maps</a>`;

    mapa.atualizar(pet.casa, raio, posicao, trilha, COR_DO_ESTADO[estado]);
  }

  async function mostrarHistorico() {
    const eventos = await dados.historico.eventos(pet.id);
    const nomes = { saida: "Saiu da área segura", fuga: "Possível fuga", retorno: "Voltou à área segura" };

    $("hist").innerHTML = eventos.slice(0, 8).map(e =>
      `<li>${new Date(e.em).toLocaleString("pt-BR")} - ${nomes[e.tipo]} (${e.distancia} m)</li>`
    ).join("") || "<li>Sem eventos. Inicie uma fuga simulada para testar.</li>";
  }

  function atualizarBotaoIniciar() {
    $("bIniciar").textContent = simulador.ativo() ? "Pausar simulação" : "Iniciar simulação";
  }

  /* ---------- Quando chega uma posição nova ---------- */
  async function receberPosicao(posicao) {
    const distancia = regras.distancia(posicao, pet.casa);
    const novoEstado = regras.estadoSeguranca(distancia, raio, estado);

    // guarda o trajeto
    trilha.push({ lat: posicao.lat, lng: posicao.lng });
    trilha = trilha.slice(-300);
    dados.historico.adicionarPonto(pet.id, { lat: posicao.lat, lng: posicao.lng });

    // mudou de estado? então gera alerta e registra no histórico
    if (novoEstado !== estado) {
      const mensagens = {
        atencao: "saiu da área segura.",
        fuga: "pode ter fugido! Está longe de casa.",
        seguro: "voltou para a área segura."
      };
      const tipos = { atencao: "saida", fuga: "fuga", seguro: "retorno" };
      const tipo = tipos[novoEstado];

      dados.alertas.criar({ tipo, petId: pet.id, petNome: pet.nome, mensagem: mensagens[novoEstado] });
      dados.historico.adicionarEvento({ petId: pet.id, tipo, distancia: Math.round(distancia), em: Date.now() });
      ui.avisar(pet.nome + " " + mensagens[novoEstado], novoEstado === "seguro" ? "ok" : "erro");

      estado = novoEstado;
      mostrarHistorico();
    }

    dados.ultimaPosicao.gravar(pet.id, {
      lat: posicao.lat, lng: posicao.lng, estado, distancia, em: Date.now()
    });
    mostrarSituacao(posicao);
  }

  /* ---------- Troca de pet ---------- */
  async function carregarPet(id) {
    if (simulador) simulador.parar();

    pet = pets.find(p => p.id === id);
    const config = await dados.config.obter();
    raio = config.raios[id] || 200;

    const ultima = await dados.ultimaPosicao.obter(id);
    trilha = await dados.historico.trajeto(id);
    estado = ultima ? ultima.estado : "seguro";

    simulador = new PC.SimuladorGPS({
      casa: pet.casa,
      posicao: ultima ? { lat: ultima.lat, lng: ultima.lng } : null,
      raio: raio,
      velocidade: config.velocidade
    });

    $("raio").value = raio;
    $("oRaio").textContent = raio + " m";
    $("vel").value = config.velocidade;

    mapa.enquadrar(pet.casa, raio);
    mostrarSituacao(simulador.posicao);
    atualizarBotaoIniciar();
    mostrarHistorico();
  }

  // Muda o modo do simulador e liga o relógio se estiver parado
  function usarModo(modo) {
    simulador.definirModo(modo);
    if (!simulador.ativo()) simulador.iniciar(receberPosicao);
    atualizarBotaoIniciar();
  }

  /* ---------- Botões e controles ---------- */
  $("selPet").onchange = evento => carregarPet(evento.target.value);

  $("bIniciar").onclick = () => {
    if (simulador.ativo()) {
      simulador.parar();
    } else {
      simulador.iniciar(receberPosicao);
    }
    atualizarBotaoIniciar();
  };

  $("bFuga").onclick = () => {
    usarModo("fuga");
    ui.avisar("Fuga simulada iniciada (dados fictícios).", "info");
  };

  $("bVolta").onclick = () => usarModo("retorno");

  $("bCasa").onclick = async () => {
    simulador.definirPosicao(pet.casa);
    simulador.definirModo("passeio");
    trilha = [];
    estado = "seguro";
    await dados.historico.limparTrajeto(pet.id);
    mostrarSituacao(simulador.posicao);
  };

  $("bLimpar").onclick = async () => {
    await dados.historico.limparEventos(pet.id);
    mostrarHistorico();
  };

  // Raio: enquanto arrasta só atualiza a tela; ao soltar, salva
  $("raio").oninput = evento => {
    raio = Number(evento.target.value);
    simulador.raio = raio;
    $("oRaio").textContent = raio + " m";
    mostrarSituacao(simulador.posicao);
  };

  $("raio").onchange = async () => {
    const config = await dados.config.obter();
    await dados.config.salvar({ raios: { ...config.raios, [pet.id]: raio } });
    mapa.enquadrar(pet.casa, raio);
  };

  $("vel").onchange = async evento => {
    simulador.multiplicador = Number(evento.target.value);
    await dados.config.salvar({ velocidade: simulador.multiplicador });
  };

  // Quando a tela volta a aparecer (modo apresentação), o mapa precisa se ajustar
  document.addEventListener("tela:mostrada", evento => {
    if (evento.detail === "meu" && pet) {
      mapa.redimensionar();
      mapa.enquadrar(pet.casa, raio);
    }
  });

  carregarPet(pets[0].id);
};
