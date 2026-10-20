/* ==========================================================
   Regras de negócio do front-end: cálculos e filtros.
   Não mexe na tela nem no LocalStorage.
   ========================================================== */
(function () {
  const GRAUS_PARA_RADIANOS = Math.PI / 180;
  const RAIO_DA_TERRA_METROS = 6371000;

  PC.regras = {
    // Distância em metros entre dois pontos {lat, lng} (fórmula de Haversine)
    distancia(a, b) {
      const dLat = (b.lat - a.lat) * GRAUS_PARA_RADIANOS;
      const dLng = (b.lng - a.lng) * GRAUS_PARA_RADIANOS;
      const x = Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * GRAUS_PARA_RADIANOS) * Math.cos(b.lat * GRAUS_PARA_RADIANOS) * Math.sin(dLng / 2) ** 2;
      return 2 * RAIO_DA_TERRA_METROS * Math.asin(Math.sqrt(x));
    },

    // Direção em graus (0 = norte, 90 = leste) indo do ponto a para o ponto b
    rumo(a, b) {
      const dLng = (b.lng - a.lng) * GRAUS_PARA_RADIANOS;
      const lat1 = a.lat * GRAUS_PARA_RADIANOS;
      const lat2 = b.lat * GRAUS_PARA_RADIANOS;
      const y = Math.sin(dLng) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
      return (Math.atan2(y, x) / GRAUS_PARA_RADIANOS + 360) % 360;
    },

    nomeDoRumo(graus) {
      const nomes = ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"];
      return nomes[Math.round(graus / 45) % 8];
    },

    // Estado do pet: "seguro" (dentro do raio), "atencao" (fora do raio)
    // ou "fuga" (além de 1,5 vez o raio). No retorno há folga de 5% para não piscar.
    estadoSeguranca(distancia, raio, estadoAnterior) {
      if (distancia > raio * 1.5) return "fuga";
      if (distancia > raio) return estadoAnterior === "fuga" ? "fuga" : "atencao";
      if (estadoAnterior && estadoAnterior !== "seguro" && distancia > raio * 0.95) return estadoAnterior;
      return "seguro";
    },

    faixaDeIdade(meses) {
      if (meses < 12) return "filhote";
      if (meses < 96) return "adulto";
      return "senior";
    },

    // Filtros do catálogo. "filtros" vem do formulário; "favoritos" é a lista de ids.
    filtrarPets(pets, filtros, favoritos) {
      const busca = (filtros.busca || "").toLowerCase();

      return pets.filter(pet => {
        const texto = (pet.nome + " " + pet.raca + " " + pet.descricao).toLowerCase();
        return (!busca || texto.includes(busca)) &&
          (!filtros.especie || pet.especie === filtros.especie) &&
          (!filtros.porte || pet.porte === filtros.porte) &&
          (!filtros.sexo || pet.sexo === filtros.sexo) &&
          (!filtros.idade || PC.regras.faixaDeIdade(pet.meses) === filtros.idade) &&
          (!filtros.status || pet.status === filtros.status) &&
          (!filtros.soFavoritos || favoritos.includes(pet.id));
      });
    }
  };
})();
