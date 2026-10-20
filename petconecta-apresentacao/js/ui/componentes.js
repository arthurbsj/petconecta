/* ==========================================================
   Componentes de interface usados em todas as telas:
   textos seguros, idade, foto do pet, aviso rápido (toast) e janela (modal).
   ========================================================== */
(function () {
  PC.ui = {
    // Evita que texto digitado vire HTML (segurança básica)
    escapar(texto) {
      const trocas = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return String(texto == null ? "" : texto).replace(/[&<>"']/g, letra => trocas[letra]);
    },

    formatarIdade(meses) {
      if (meses < 12) return meses + " meses";
      const anos = Math.floor(meses / 12);
      return anos + (anos === 1 ? " ano" : " anos");
    },

    // Foto ilustrativa (emoji sobre uma cor), pois os animais são fictícios
    fotoDoPet(pet) {
      let soma = 0;
      for (const letra of pet.id) soma += letra.charCodeAt(0) * 7;
      const emoji = pet.especie === "Gato" ? "🐱" : "🐶";
      return `<span class="foto" style="background:hsl(${soma % 360} 40% 40%)" title="Ilustração fictícia">${emoji}</span>`;
    },

    // Mensagem rápida no canto da tela. tipo: "ok", "erro" ou "info"
    avisar(mensagem, tipo) {
      const aviso = document.createElement("div");
      aviso.className = "toast " + (tipo || "ok");
      aviso.textContent = mensagem;
      aviso.setAttribute("role", "status");
      document.body.appendChild(aviso);
      setTimeout(() => aviso.remove(), 4000);
    },

    // Abre uma janela com título e conteúdo HTML. Devolve o elemento (use .fecharJanela()).
    abrirModal(titulo, conteudoHtml) {
      const fundo = document.createElement("div");
      fundo.className = "fundo-modal";
      fundo.innerHTML = `
        <div class="modal card" role="dialog" aria-modal="true" aria-label="${PC.ui.escapar(titulo)}">
          <button class="fechar" aria-label="Fechar">×</button>
          <h2>${PC.ui.escapar(titulo)}</h2>
          ${conteudoHtml}
        </div>`;

      fundo.fecharJanela = () => fundo.remove();
      fundo.querySelector(".fechar").onclick = fundo.fecharJanela;
      fundo.onclick = evento => {
        if (evento.target === fundo) fundo.fecharJanela();
      };

      document.body.appendChild(fundo);
      return fundo;
    },

    // Monta as <option> de um <select>, marcando a opção escolhida
    opcoes(lista, escolhida) {
      return lista.map(item => `<option ${item === escolhida ? "selected" : ""}>${item}</option>`).join("");
    }
  };
})();
