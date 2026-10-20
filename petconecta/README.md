# PetConecta – Front-end (HTML + CSS + JavaScript puro)

Escopo: apenas front-end. Back-end, banco, autenticação real e integrações ficam com outros integrantes. Todos os dados são **fictícios**, e o GPS é **simulado**.

## 1. Como executar
Abra `index.html` no navegador (duplo clique). Não há build nem servidor. Os scripts são comuns (sem módulos ES), então funcionam via `file://`. O mapa usa Leaflet/OpenStreetMap e **precisa de internet** (CDN).
Páginas: `index.html` (Meu Pet), `catalogo.html` (Catálogo de Adoção), `ong.html` (Área da ONG).

## 2. LocalStorage
Somente `js/servicos/armazenamento.js` acessa o LocalStorage (prefixo `petconecta:`). Chaves: pets, favoritos, config (raio por pet e velocidade), solicitacoes, alertas, tutores, trajetos, eventos, atividades, ultima. O botão "Restaurar dados de demonstração" (rodapé) apaga tudo e recria os dados iniciais.

## 3. Testar a fuga simulada
1. Em **Meu Pet**, escolha Thor ou Mel e clique em **Iniciar simulação** (passeio dentro do raio).
2. Clique em **Simular fuga**. Aumente a velocidade (5x ou 10x) para acelerar.
3. Fora do raio: estado "Fora do raio" + alerta de saída. Além de 1,5x o raio: "Possível fuga" + alerta. Veja o sino 🔔, o histórico e o painel "Como chegar".
4. **Fazer voltar** leva o pet para casa e gera o alerta de retorno. O raio é ajustável no controle deslizante.

## 4. Demonstrativo x dependente de back-end
Demonstrativo (front-end): CRUD de animais, filtros, favoritos, interesse em adoção, painel e atividades, mapa, simulador GPS, raio, alertas, histórico, configurações.
Dependem de back-end (não implementados): listar/detalhar/cadastrar/atualizar/remover animais; cadastrar ONGs; autenticar usuários; registrar solicitações de adoção; histórico de localização; salvar configurações de segurança; receber coordenadas reais de dispositivos GPS; notificações e alertas reais.

## 5. Estrutura
- `js/servicos/` – acesso a dados (`pet-service.js`, `dados-service.js`) e LocalStorage.
- `js/nucleo/regras.js` – regras de negócio (distância, estado de segurança, filtros).
- `js/gps/simulador-gps.js` – motor do GPS simulado (sem DOM/mapa).
- `js/ui/` – layout/alertas (`layout.js`) e mapa (`mapa.js`).
- `js/paginas/` – um controlador por página.

## 6. Como trocar pelos serviços reais
1. Todas as funções dos serviços retornam **Promises**. Reescreva o corpo delas com `fetch()` mantendo nomes e formato de retorno; as telas não mudam.
2. GPS: crie uma fonte com o mesmo contrato do simulador (`iniciar(cb)`, `parar()`, `ativo()`) que chame `cb({lat,lng,t})` com dados reais, e use-a em `meu-pet.js` no lugar de `SimuladorGPS`.
3. Endpoints **propostos (PENDENTES, não existem)**: `GET /animais`, `GET /animais/{id}`, `POST /animais`, `PUT /animais/{id}`, `DELETE /animais/{id}`, `POST /ongs`, `POST /auth/login`, `POST /solicitacoes-adocao`, `GET /animais/{id}/localizacoes`, `PUT /animais/{id}/config-seguranca`, `POST /dispositivos/{id}/coordenadas`, `GET /alertas`.

## 7. Tutores e contatos periódicos (Área da ONG)
- Tabela com dados do tutor (fictícios), intervalo de contato em dias, último/próximo contato e situação (em dia, vence em breve, atrasado).
- **Registrar contato** guarda canal, como está o animal e observações, e reinicia o prazo. **Histórico** lista os contatos anteriores. **Editar tutor** altera dados e o intervalo (X dias).
- Ao aprovar uma adoção, os dados do formulário de interesse viram o cadastro do tutor (intervalo padrão: 30 dias).
- Alerta no sino 🔔 (1 por dia por animal) enquanto o contato estiver atrasado. A verificação roda quando uma página é aberta, pois não há servidor; lembretes reais por e-mail/push dependem do back-end.
- Teste: Thor já nasce com contato atrasado (exemplo). Os dados pessoais reais só devem ser tratados por um back-end seguro (LGPD).
- Endpoints propostos (PENDENTES): `GET/PUT /animais/{id}/tutor`, `POST /animais/{id}/contatos`, `GET /animais/{id}/contatos`.
