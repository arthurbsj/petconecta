/* ==========================================================
   Serviço de tutores e contatos periódicos (demonstrativo).
   A ONG define de quantos em quantos dias deve contatar cada tutor
   e registra como o animal está. Dados de exemplo são FICTÍCIOS.
   ========================================================== */
(function () {
  const A = PC.armazenamento;
  const UM_DIA = 24 * 60 * 60 * 1000;

  function tutoresIniciais() {
    const agora = Date.now();
    return {
      p7: {
        nome: "Ana Souza (fictícia)", telefone: "(11) 90000-0001", email: "ana@exemplo.com",
        moradia: "Casa", intervaloDias: 30, ultimoContato: agora - 40 * UM_DIA, ultimoAlerta: 0,
        contatos: [{ em: agora - 40 * UM_DIA, canal: "Telefone", situacao: "bem", obs: "Adaptação ótima (exemplo)." }]
      },
      p8: {
        nome: "Carlos Lima (fictício)", telefone: "(11) 90000-0002", email: "carlos@exemplo.com",
        moradia: "Apartamento", intervaloDias: 15, ultimoContato: agora - 5 * UM_DIA, ultimoAlerta: 0,
        contatos: []
      }
    };
  }

  // Tutores ficam guardados por id do pet: { p7: {...}, p8: {...} }
  function lerTutores() {
    let tutores = A.ler("tutores", null);
    if (!tutores) {
      tutores = tutoresIniciais();
      A.gravar("tutores", tutores);
    }
    return tutores;
  }

  function alterarTutores(funcao) {
    const tutores = lerTutores();
    funcao(tutores);
    A.gravar("tutores", tutores);
  }

  // Situação do contato: "atrasado", "proximo" (vence em até 3 dias) ou "emdia"
  function situacao(tutor) {
    const diasPassados = (Date.now() - tutor.ultimoContato) / UM_DIA;
    if (diasPassados >= tutor.intervaloDias) return "atrasado";
    if (diasPassados >= tutor.intervaloDias - 3) return "proximo";
    return "emdia";
  }

  // Cria o cadastro do tutor dos pets adotados que têm uma solicitação aprovada
  async function sincronizar() {
    const pets = await PC.petService.listar();
    const solicitacoes = await PC.dados.solicitacoes.listar();
    const tutores = lerTutores();
    let mudou = false;

    pets.filter(p => p.status === "adotado" && !tutores[p.id]).forEach(pet => {
      const s = solicitacoes.find(x => x.petId === pet.id && x.status === "aprovada");
      if (s) {
        tutores[pet.id] = {
          nome: s.nome, telefone: s.telefone, email: s.email, moradia: s.moradia,
          intervaloDias: 30, ultimoContato: Date.now(), ultimoAlerta: 0, contatos: []
        };
        mudou = true;
      }
    });

    if (mudou) A.gravar("tutores", tutores);
  }

  // Gera 1 alerta por dia para cada contato atrasado (aparece no sino da ONG)
  async function verificarContatosAtrasados() {
    await sincronizar();
    const tutores = lerTutores();
    const pets = await PC.petService.listar();
    const hoje = Math.floor(Date.now() / UM_DIA);
    let criouAlerta = false;

    for (const petId in tutores) {
      const tutor = tutores[petId];
      const pet = pets.find(p => p.id === petId);
      const precisaAlertar = pet && pet.status === "adotado" &&
        situacao(tutor) === "atrasado" && tutor.ultimoAlerta !== hoje;

      if (precisaAlertar) {
        const dias = Math.floor((Date.now() - tutor.ultimoContato) / UM_DIA);
        tutor.ultimoAlerta = hoje;
        criouAlerta = true;
        await PC.dados.alertas.criar({
          tipo: "contato",
          petId: petId,
          petNome: pet.nome,
          mensagem: "- hora de contatar o tutor (" + tutor.nome + "): último contato há " + dias + " dias."
        });
      }
    }

    if (criouAlerta) A.gravar("tutores", tutores);
  }

  PC.tutorService = {
    situacao,
    sincronizar,
    verificarContatosAtrasados,

    proximoContato(tutor) {
      return tutor.ultimoContato + tutor.intervaloDias * UM_DIA;
    },
    listar() {
      return Promise.resolve(lerTutores());
    },
    // Cria ou atualiza os dados do tutor de um pet
    salvar(petId, dadosDoTutor) {
      alterarTutores(tutores => {
        tutores[petId] = {
          intervaloDias: 30, ultimoContato: Date.now(), ultimoAlerta: 0, contatos: [],
          ...tutores[petId], ...dadosDoTutor
        };
      });
      return Promise.resolve(true);
    },
    // Registra um contato e reinicia o prazo do próximo
    registrarContato(petId, contato) {
      alterarTutores(tutores => {
        tutores[petId].contatos = [{ ...contato, em: Date.now() }, ...tutores[petId].contatos];
        tutores[petId].ultimoContato = Date.now();
        tutores[petId].ultimoAlerta = 0;
      });
      return Promise.resolve(true);
    },
    remover(petId) {
      alterarTutores(tutores => {
        delete tutores[petId];
      });
      return Promise.resolve(true);
    }
  };

  // Verifica os prazos assim que a página abre
  setTimeout(verificarContatosAtrasados, 0);
})();
