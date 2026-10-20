/* ==========================================================
   Serviços de dados auxiliares (demonstrativos, em LocalStorage):
   favoritos, configurações, solicitações de adoção, alertas,
   histórico de localização, atividades e última posição.
   Todos devolvem Promises para facilitar a troca por uma API.
   ========================================================== */
(function () {
  const A = PC.armazenamento;
  const pronto = valor => Promise.resolve(valor);

  // Altera um objeto guardado por pet (ex.: trajetos[petId])
  function alterarObjeto(chave, funcao) {
    const objeto = A.ler(chave, {});
    funcao(objeto);
    A.gravar(chave, objeto);
  }

  PC.dados = {};

  /* ---------- Favoritos: lista de ids de pets ---------- */
  PC.dados.favoritos = {
    listar() {
      return pronto(A.ler("favoritos", []));
    },
    alternar(petId) {
      const lista = A.ler("favoritos", []);
      const posicao = lista.indexOf(petId);
      if (posicao >= 0) {
        lista.splice(posicao, 1);
      } else {
        lista.push(petId);
      }
      A.gravar("favoritos", lista);
      return pronto(lista);
    }
  };

  /* ---------- Configurações: raio de cada pet e velocidade da simulação ---------- */
  PC.dados.config = {
    obter() {
      return pronto({ raios: {}, velocidade: 1, ...A.ler("config", {}) });
    },
    salvar(parte) {
      const nova = { raios: {}, velocidade: 1, ...A.ler("config", {}), ...parte };
      A.gravar("config", nova);
      return pronto(nova);
    }
  };

  /* ---------- Solicitações de adoção ---------- */
  PC.dados.solicitacoes = {
    listar() {
      return pronto(A.ler("solicitacoes", []));
    },
    criar(dadosDoInteressado) {
      const lista = A.ler("solicitacoes", []);
      const nova = { ...dadosDoInteressado, id: PC.novoId(), status: "pendente", em: Date.now() };
      lista.unshift(nova);
      A.gravar("solicitacoes", lista);
      return pronto(nova);
    },
    atualizarStatus(id, status) {
      const lista = A.ler("solicitacoes", []).map(s => (s.id === id ? { ...s, status } : s));
      A.gravar("solicitacoes", lista);
      return pronto(true);
    }
  };

  /* ---------- Alertas (aparecem no sino) ---------- */
  function avisarMudancaDeAlertas() {
    document.dispatchEvent(new Event("alertas:mudou"));
  }

  PC.dados.alertas = {
    listar() {
      return pronto(A.ler("alertas", []));
    },
    // tipo: "saida", "fuga", "retorno" ou "contato"
    criar(alerta) {
      const lista = A.ler("alertas", []);
      lista.unshift({ ...alerta, id: PC.novoId(), em: Date.now(), lida: false });
      A.gravar("alertas", lista.slice(0, 50));
      avisarMudancaDeAlertas();
      return pronto(true);
    },
    marcarTodasLidas() {
      A.gravar("alertas", A.ler("alertas", []).map(a => ({ ...a, lida: true })));
      avisarMudancaDeAlertas();
      return pronto(true);
    }
  };

  /* ---------- Histórico demonstrativo: trajeto e eventos de cada pet ---------- */
  PC.dados.historico = {
    trajeto(petId) {
      return pronto(A.ler("trajetos", {})[petId] || []);
    },
    adicionarPonto(petId, ponto) {
      alterarObjeto("trajetos", trajetos => {
        trajetos[petId] = [...(trajetos[petId] || []), ponto].slice(-300);
      });
      return pronto(true);
    },
    limparTrajeto(petId) {
      alterarObjeto("trajetos", trajetos => {
        trajetos[petId] = [];
      });
      return pronto(true);
    },
    eventos(petId) {
      return pronto(A.ler("eventos", []).filter(e => e.petId === petId));
    },
    adicionarEvento(evento) {
      A.gravar("eventos", [evento, ...A.ler("eventos", [])].slice(0, 100));
      return pronto(true);
    },
    limparEventos(petId) {
      A.gravar("eventos", A.ler("eventos", []).filter(e => e.petId !== petId));
      return pronto(true);
    }
  };

  /* ---------- Atividades recentes (painel da ONG) ---------- */
  PC.dados.atividades = {
    listar() {
      return pronto(A.ler("atividades", []));
    },
    registrar(texto) {
      A.gravar("atividades", [{ texto, em: Date.now() }, ...A.ler("atividades", [])].slice(0, 30));
      return pronto(true);
    }
  };

  /* ---------- Última posição conhecida de cada pet ---------- */
  PC.dados.ultimaPosicao = {
    obter(petId) {
      return pronto(A.ler("ultimaPosicao", {})[petId] || null);
    },
    gravar(petId, posicao) {
      alterarObjeto("ultimaPosicao", mapa => {
        mapa[petId] = posicao;
      });
      return pronto(true);
    }
  };
})();
