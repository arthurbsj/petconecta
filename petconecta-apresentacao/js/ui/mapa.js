/* ==========================================================
   Mapa do projeto (só desenha, não gera coordenadas).
   - Se houver chave em js/config.js, usa o GOOGLE MAPS.
   - Sem chave (ou se a chave falhar), usa o OpenStreetMap (Leaflet).
   Os dois "motores" têm as mesmas funções, então as telas não percebem a troca.
   ========================================================== */
(function () {
  /* ---------- Carregar bibliotecas externas ---------- */
  function carregarScript(url) {
    return new Promise((ok, falhou) => {
      const tag = document.createElement("script");
      tag.src = url;
      tag.onload = ok;
      tag.onerror = () => falhou(new Error("Falha ao carregar " + url));
      document.head.appendChild(tag);
    });
  }

  function carregarEstilo(url) {
    return new Promise((ok, falhou) => {
      const tag = document.createElement("link");
      tag.rel = "stylesheet";
      tag.href = url;
      tag.onload = ok;
      tag.onerror = () => falhou(new Error("Falha ao carregar " + url));
      document.head.appendChild(tag);
    });
  }

  function carregarGoogle() {
    return new Promise((ok, falhou) => {
      if (window.google && google.maps) return ok();
      window.googleMapsPronto = ok; // o Google chama esta função quando termina de carregar
      const chave = encodeURIComponent(PC.config.GOOGLE_MAPS_CHAVE);
      const url = "https://maps.googleapis.com/maps/api/js?key=" + chave +
        "&callback=googleMapsPronto&language=pt-BR&region=BR";
      carregarScript(url).catch(falhou);
      setTimeout(() => falhou(new Error("Google Maps demorou demais")), 10000); // plano B
    });
  }

  /* ---------- Motor 1: Google Maps ---------- */
  class MotorGoogle {
    constructor(idDoElemento) {
      this.mapa = new google.maps.Map(document.getElementById(idDoElemento), {
        center: { lat: -23.55, lng: -46.63 },
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false
      });
      this.area = new google.maps.Circle({
        map: this.mapa, strokeColor: "#c9a24b", fillColor: "#c9a24b", fillOpacity: 0.15
      });
      this.trajeto = new google.maps.Polyline({ map: this.mapa, strokeColor: "#0e1f3d", strokeWeight: 3 });
      this.casa = new google.maps.Marker({ map: this.mapa, title: "Casa (fictícia)", label: "🏠" });
      this.pet = new google.maps.Marker({ map: this.mapa, title: "Pet (simulado)" });
    }

    enquadrar(casa, raio) {
      this.area.setCenter(casa);
      this.area.setRadius(raio);
      this.mapa.fitBounds(this.area.getBounds());
    }

    atualizar(casa, raio, posicao, trilha, cor) {
      const ponto = { lat: posicao.lat, lng: posicao.lng };
      this.area.setCenter(casa);
      this.area.setRadius(raio);
      this.casa.setPosition(casa);
      this.pet.setPosition(ponto);
      this.pet.setIcon({
        path: google.maps.SymbolPath.CIRCLE, scale: 9,
        fillColor: cor, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2
      });
      this.trajeto.setPath(trilha.map(p => ({ lat: p.lat, lng: p.lng })));

      // se o pet saiu da área visível, ajusta o zoom para mostrar casa e pet
      const visivel = this.mapa.getBounds();
      if (visivel && !visivel.contains(ponto)) {
        const limites = new google.maps.LatLngBounds(casa);
        limites.extend(ponto);
        this.mapa.fitBounds(limites);
      }
    }

    redimensionar() {
      google.maps.event.trigger(this.mapa, "resize");
    }
  }

  /* ---------- Motor 2: OpenStreetMap (Leaflet) ---------- */
  class MotorLeaflet {
    constructor(idDoElemento) {
      this.mapa = L.map(idDoElemento).setView([-23.55, -46.63], 16);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: "© OpenStreetMap"
      }).addTo(this.mapa);
      this.area = L.circle([0, 0], { color: "#c9a24b", fillOpacity: 0.12 }).addTo(this.mapa);
      this.trajeto = L.polyline([], { color: "#0e1f3d", weight: 3 }).addTo(this.mapa);
      this.casa = L.marker([0, 0], { title: "Casa (fictícia)" }).addTo(this.mapa);
      this.pet = L.circleMarker([0, 0], { radius: 9, color: "#fff", weight: 2, fillOpacity: 1 }).addTo(this.mapa);
    }

    enquadrar(casa, raio) {
      this.mapa.fitBounds(L.circle([casa.lat, casa.lng], { radius: raio * 1.8 }).getBounds());
    }

    atualizar(casa, raio, posicao, trilha, cor) {
      const ponto = [posicao.lat, posicao.lng];
      this.area.setLatLng([casa.lat, casa.lng]).setRadius(raio);
      this.casa.setLatLng([casa.lat, casa.lng]);
      this.pet.setLatLng(ponto).setStyle({ fillColor: cor });
      this.trajeto.setLatLngs(trilha.map(p => [p.lat, p.lng]));

      if (!this.mapa.getBounds().contains(ponto)) {
        this.mapa.fitBounds(L.latLngBounds([ponto, [casa.lat, casa.lng]]).pad(0.3));
      }
    }

    redimensionar() {
      this.mapa.invalidateSize();
    }
  }

  /* ---------- Mapa: escolhe o motor e repassa os comandos ---------- */
  class Mapa {
    constructor(idDoElemento) {
      this.id = idDoElemento;
      this.motor = null;
      this.ultimoEnquadre = null;   // guardados para repetir se o motor for trocado
      this.ultimaAtualizacao = null;
    }

    async iniciar() {
      if (PC.config.GOOGLE_MAPS_CHAVE) {
        try {
          // o Google chama esta função se a chave for inválida ou não tiver faturamento
          window.gm_authFailure = () => this.usarOpenStreetMap();
          await carregarGoogle();
          this.motor = new MotorGoogle(this.id);
          this.repetirComandos();
          return;
        } catch (erro) {
          console.warn("Google Maps indisponível, usando OpenStreetMap.", erro);
        }
      }
      await this.usarOpenStreetMap();
    }

    async usarOpenStreetMap() {
      const elemento = document.getElementById(this.id);
      this.motor = null;
      elemento.innerHTML = "";
      try {
        await carregarEstilo("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css");
        await carregarScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js");
        this.motor = new MotorLeaflet(this.id);
        this.repetirComandos();
      } catch (erro) {
        elemento.style.padding = "1rem";
        elemento.textContent = "Não foi possível carregar o mapa. Verifique a conexão com a internet.";
      }
    }

    repetirComandos() {
      if (this.ultimoEnquadre) this.motor.enquadrar(...this.ultimoEnquadre);
      if (this.ultimaAtualizacao) this.motor.atualizar(...this.ultimaAtualizacao);
    }

    enquadrar(casa, raio) {
      this.ultimoEnquadre = [casa, raio];
      if (this.motor) this.motor.enquadrar(casa, raio);
    }

    atualizar(casa, raio, posicao, trilha, cor) {
      this.ultimaAtualizacao = [casa, raio, posicao, trilha, cor];
      if (this.motor) this.motor.atualizar(casa, raio, posicao, trilha, cor);
    }

    redimensionar() {
      if (this.motor) this.motor.redimensionar();
    }
  }

  PC.Mapa = Mapa;
})();
