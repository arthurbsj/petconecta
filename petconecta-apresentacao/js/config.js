/* ==========================================================
   Configurações do projeto. É o único arquivo que você precisa editar.
   ========================================================== */

// "PC" (PetConecta) é o objeto onde ficam todos os módulos do projeto.
window.PC = {
  paginas: {} // cada tela registra aqui a sua função de início
};

PC.config = {
  // Chave da API do Google Maps (Maps JavaScript API).
  // Deixe vazio ("") para usar o mapa gratuito do OpenStreetMap.
  GOOGLE_MAPS_CHAVE: "",

  // Logins FICTÍCIOS, só para demonstração. Não é segurança real.
  USUARIOS: {
    dono: { email: "dono@petconecta.demo", senha: "123456", nome: "Maria (dona fictícia)" },
    ong:  { email: "ong@petconecta.demo",  senha: "123456", nome: "Equipe da ONG (fictícia)" }
  }
};
