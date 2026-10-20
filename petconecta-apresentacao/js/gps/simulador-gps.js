/* ==========================================================
   Motor do GPS SIMULADO.
   Não conhece mapa, tela nem LocalStorage: só gera posições.

   Contrato de uma "fonte de coordenadas" (para trocar por GPS real depois):
     iniciar(aoReceberPosicao)  começa a enviar posições {lat, lng}
     parar()                    para de enviar
     ativo()                    diz se está enviando
   Uma fonte real (API ou dispositivo) só precisa oferecer as mesmas funções.
   ========================================================== */
(function () {
  const METROS_POR_GRAU = 111320;

  // Velocidade base de cada modo, em metros por segundo
  const VELOCIDADES = { passeio: 1.4, fuga: 4, retorno: 4, parado: 0 };

  class SimuladorGPS {
    constructor({ casa, posicao, raio, velocidade }) {
      this.casa = casa;
      this.posicao = posicao || { lat: casa.lat, lng: casa.lng };
      this.raio = raio;
      this.multiplicador = velocidade || 1; // 1x, 2x, 5x, 10x
      this.modo = "passeio"; // "passeio", "fuga", "retorno" ou "parado"
      this.rumo = Math.random() * 360;
      this.relogio = null;
    }

    iniciar(aoReceberPosicao) {
      this.parar();
      this.aoReceberPosicao = aoReceberPosicao;
      this.relogio = setInterval(() => this.dar1Passo(), 1000);
    }

    parar() {
      clearInterval(this.relogio);
      this.relogio = null;
    }

    ativo() {
      return this.relogio !== null;
    }

    definirModo(modo) {
      this.modo = modo;
      if (modo === "fuga") {
        this.rumo = Math.random() * 360; // foge para uma direção qualquer
      }
    }

    definirPosicao(posicao) {
      this.posicao = { lat: posicao.lat, lng: posicao.lng };
    }

    // Executado a cada segundo: calcula a nova posição e avisa quem estiver ouvindo
    dar1Passo() {
      const regras = PC.regras;
      const distanciaDeCasa = regras.distancia(this.posicao, this.casa);
      const metros = VELOCIDADES[this.modo] * this.multiplicador;
      let chegouEmCasa = false;

      if (this.modo === "fuga") {
        this.rumo += (Math.random() - 0.5) * 20; // pequena variação na direção
      } else if (this.modo === "retorno") {
        this.rumo = regras.rumo(this.posicao, this.casa);
        if (distanciaDeCasa <= metros) {
          this.posicao = { lat: this.casa.lat, lng: this.casa.lng };
          this.modo = "passeio";
          chegouEmCasa = true;
        }
      } else if (this.modo === "passeio") {
        // passeia perto de casa; se se afastar demais, volta para o centro
        const limite = this.raio * 0.6;
        this.rumo = distanciaDeCasa > limite
          ? regras.rumo(this.posicao, this.casa)
          : this.rumo + (Math.random() - 0.5) * 60;
      }

      if (!chegouEmCasa) {
        const radianos = this.rumo * Math.PI / 180;
        const metrosPorGrauLng = METROS_POR_GRAU * Math.cos(this.posicao.lat * Math.PI / 180);
        this.posicao = {
          lat: this.posicao.lat + (metros * Math.cos(radianos)) / METROS_POR_GRAU,
          lng: this.posicao.lng + (metros * Math.sin(radianos)) / metrosPorGrauLng
        };
      }

      this.aoReceberPosicao({ lat: this.posicao.lat, lng: this.posicao.lng, modo: this.modo });
    }
  }

  PC.SimuladorGPS = SimuladorGPS;
})();
