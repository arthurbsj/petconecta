/* ==========================================================
   Serviço de animais.
   Hoje usa dados fictícios + LocalStorage. Para usar uma API real,
   troque o corpo de cada função por um fetch() mantendo o retorno (Promise).
   ========================================================== */
(function () {
  const A = PC.armazenamento;
  const CASA_PADRAO = { lat: -23.5614, lng: -46.6559 };

  // status: "disponivel", "analise" ou "adotado". Só pets adotados têm "casa" e tutor.
  function criarPet(id, nome, especie, raca, meses, porte, sexo, descricao, status, casa) {
    return { id, nome, especie, raca, meses, porte, sexo, descricao, status, tutor: Boolean(casa), casa };
  }

  const PETS_INICIAIS = [
    criarPet("p1", "Bidu",   "Cachorro", "SRD",          24,  "Médio",   "Macho", "Brincalhão e ótimo com crianças.", "disponivel"),
    criarPet("p2", "Luna",   "Gato",     "SRD",          12,  "Pequeno", "Fêmea", "Calma e adora colo.",              "disponivel"),
    criarPet("p3", "Pipoca", "Cachorro", "Poodle mix",   48,  "Pequeno", "Fêmea", "Dócil e sociável.",                "analise"),
    criarPet("p4", "Zeus",   "Cachorro", "Labrador mix", 36,  "Grande",  "Macho", "Enérgico, precisa de espaço.",     "disponivel"),
    criarPet("p5", "Simba",  "Gato",     "SRD laranja",  6,   "Pequeno", "Macho", "Filhote curioso.",                 "disponivel"),
    criarPet("p6", "Tobias", "Cachorro", "Beagle mix",   100, "Médio",   "Macho", "Sênior tranquilo.",                "disponivel"),
    criarPet("p7", "Thor",   "Cachorro", "Golden mix",   36,  "Grande",  "Macho", "Adotado (demonstração).",          "adotado", CASA_PADRAO),
    criarPet("p8", "Mel",    "Gato",     "SRD",          30,  "Pequeno", "Fêmea", "Adotada (demonstração).",          "adotado", { lat: -23.5505, lng: -46.6333 })
  ];

  function lerTodos() {
    let pets = A.ler("pets", null);
    if (!pets) {
      pets = PETS_INICIAIS;
      A.gravar("pets", pets);
    }
    return pets;
  }

  // Regra: pet adotado ganha tutor e uma "casa" fictícia; os outros não são monitorados.
  function ajustarAdocao(pet) {
    if (pet.status !== "adotado") {
      return { ...pet, tutor: false };
    }
    if (pet.casa) {
      return { ...pet, tutor: true };
    }
    const casa = {
      lat: CASA_PADRAO.lat + (Math.random() - 0.5) * 0.004,
      lng: CASA_PADRAO.lng + (Math.random() - 0.5) * 0.004
    };
    return { ...pet, tutor: true, casa };
  }

  PC.petService = {
    listar() {
      return Promise.resolve(lerTodos());
    },

    obter(id) {
      return Promise.resolve(lerTodos().find(p => p.id === id) || null);
    },

    criar(dadosDoPet) {
      const pet = ajustarAdocao({ ...dadosDoPet, id: PC.novoId() });
      A.gravar("pets", [...lerTodos(), pet]);
      return Promise.resolve(pet);
    },

    atualizar(id, alteracoes) {
      const pets = lerTodos().map(p => (p.id === id ? ajustarAdocao({ ...p, ...alteracoes }) : p));
      A.gravar("pets", pets);
      return Promise.resolve(pets.find(p => p.id === id));
    },

    remover(id) {
      A.gravar("pets", lerTodos().filter(p => p.id !== id));
      return Promise.resolve(true);
    }
  };
})();
