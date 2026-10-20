# PetConecta - Front-end (Apresentação (3 telas em 1 página))

Projeto só de front-end, feito com **HTML, CSS e JavaScript puro**. O back-end, o banco de dados e a autenticação real ficam para outros integrantes. Todos os dados são **fictícios** e o GPS é **simulado**.

## 1. Como abrir
Abra `index.html`. As 3 telas ficam na mesma página; o menu do topo troca de tela (ideal para apresentar).

## 2. Logins fictícios (só para demonstração)
| Área | E-mail | Senha |
|---|---|---|
| Dono do pet (Meu Pet) | dono@petconecta.demo | 123456 |
| ONG (Área da ONG) | ong@petconecta.demo | 123456 |

O catálogo é público. Os logins ficam em `js/config.js` e a sessão é guardada no navegador. Isso **não é segurança real**: a autenticação de verdade será feita no back-end.

## 3. Mapa: Google Maps (com plano B)
O mapa usa o **Google Maps** quando há uma chave em `js/config.js` (`GOOGLE_MAPS_CHAVE`). Sem chave, ou se ela falhar, usa o **OpenStreetMap** automaticamente, então a tela nunca fica sem mapa.

Como obter a chave:
1. Acesse o Google Cloud Console e crie um projeto.
2. Ative a **Maps JavaScript API** (o Google exige uma conta de faturamento, mas há crédito gratuito mensal).
3. Crie uma chave de API em "Credenciais" e restrinja por site (HTTP referrer).
4. Cole a chave em `js/config.js`.

Dica: restrição por site não funciona com `file://`. Para testar com a chave, rode um servidor local na pasta do projeto, por exemplo `python -m http.server 8000`, e abra `http://localhost:8000`. Adicione `http://localhost:8000/*` aos sites permitidos da chave.

## 4. Como funciona o LocalStorage
Somente `js/servicos/armazenamento.js` acessa o LocalStorage (prefixo `petconecta:`). O botão "Restaurar dados de demonstração" (rodapé) apaga tudo e recria os dados iniciais.

## 5. Como testar a fuga simulada
1. Entre em **Meu Pet** com o login do dono e clique em **Iniciar simulação** (o pet passeia dentro do raio).
2. Clique em **Simular fuga**. Use a velocidade 5x ou 10x para acelerar.
3. Fora do raio: estado "Fora do raio" e alerta de saída. Além de 1,5 vez o raio: "Possível fuga" e novo alerta. Veja o sino 🔔, o histórico e o painel "Como chegar".
4. **Fazer voltar** leva o pet para casa e gera o alerta de retorno. O raio e a velocidade ficam salvos.

## 6. O que é demonstrativo e o que depende do back-end
**Demonstrativo (funciona só no front-end):** login fictício, cadastro/edição/exclusão de animais, filtros, favoritos, interesse em adoção, painel e atividades, tutores e contatos periódicos, mapa, simulador GPS, raio, alertas e histórico.

**Depende do futuro back-end (não implementado):** listar/detalhar/cadastrar/atualizar/remover animais; cadastrar ONGs; autenticar usuários; registrar solicitações de adoção; histórico de localização; salvar configurações de segurança; receber coordenadas reais de dispositivos GPS; notificações e alertas reais (e-mail/push); dados reais de tutores (exigem cuidado com a LGPD).

## 7. Estrutura das pastas
```
css/estilo.css                 estilos de todas as telas
js/config.js                   chave do Google Maps e logins fictícios
js/servicos/                   acesso aos dados (hoje LocalStorage, amanhã API)
  armazenamento.js             único arquivo que usa o LocalStorage
  auth-service.js              login fictício
  pet-service.js               animais (listar, criar, atualizar, remover)
  dados-service.js             favoritos, config, solicitações, alertas, histórico
  tutor-service.js             tutores e contatos periódicos
js/nucleo/regras.js            cálculos (distância, estado de segurança) e filtros
js/gps/simulador-gps.js        motor do GPS simulado (sem tela)
js/ui/                         componentes, layout/menu/sino, login e mapa
js/paginas/                    um arquivo por tela
```
Cada arquivo tem um comentário no topo explicando o que faz.

## 8. Como trocar os serviços demonstrativos por uma API
1. As funções dos serviços (`js/servicos/`) devolvem **Promises**. Reescreva o corpo delas com `fetch()` mantendo o nome e o formato do retorno; as telas não precisam mudar.
2. GPS real: crie uma fonte com as mesmas funções do simulador (`iniciar`, `parar`, `ativo`) que envie `{lat, lng}` de dispositivos reais e use-a em `js/paginas/meu-pet.js` no lugar de `SimuladorGPS`.
3. Login real: troque `js/servicos/auth-service.js` por chamadas ao back-end.
4. Endpoints **propostos (PENDENTES, não existem)**: `GET/POST /animais`, `GET/PUT/DELETE /animais/{id}`, `POST /ongs`, `POST /auth/login`, `POST /solicitacoes-adocao`, `GET /animais/{id}/localizacoes`, `PUT /animais/{id}/config-seguranca`, `POST /dispositivos/{id}/coordenadas`, `GET /alertas`, `GET/PUT /animais/{id}/tutor`, `GET/POST /animais/{id}/contatos`.
