/* ============================================================
   PERFIL  —  quem está jogando

   Até agora o jogo não sabia quem era ela. Nenhum personagem a
   chamava pelo nome e cada rodada começava e terminava no vazio.
   Aos 4 anos é isso que segura a atenção: alguém que te reconhece
   e uma missão que tem fim.

   Guarda três coisas no aparelho:
     nome    — para a voz chamar por ele
     amiga   — a pônei que acompanha ela em todos os jogos
     missao  — 3 desafios por dia, que zeram na virada do dia

   Usado por todas as páginas. Basta <script src="perfil.js"></script>.
   ============================================================ */

const PERFIL_CHAVE = "poneis.perfil.v1";
const DESAFIOS_POR_DIA = 3;

/* candidatas a amiga: pôneis com imagem conferida na pasta */
const AMIGAS = [
  "Rarity", "Princesa Celestia", "Princesa Cadance", "Apple Bloom",
  "Sweetie Belle", "Scootaloo", "Trixie", "Diamond Tiara"
];

function hojeTexto(){
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function perfil(){
  let p;
  try{ p = JSON.parse(localStorage.getItem(PERFIL_CHAVE) || "null"); }
  catch(e){ p = null; }

  if(!p || typeof p !== "object") p = {};
  if(typeof p.nome !== "string") p.nome = "";
  if(!AMIGAS.includes(p.amiga)) p.amiga = null;
  if(!p.missao || p.missao.dia !== hojeTexto()){
    p.missao = { dia: hojeTexto(), feitos: 0, premiada: false };
  }
  return p;
}

function salvaPerfil(p){
  try{ localStorage.setItem(PERFIL_CHAVE, JSON.stringify(p)); return true; }
  catch(e){ return false; }
}

function temPerfil(){
  const p = perfil();
  return !!(p.nome && p.amiga);
}

function nomeDela(){ return perfil().nome; }
function amigaDela(){ return perfil().amiga; }
function imgDaAmiga(){
  const a = amigaDela();
  return a ? "imagens/" + encodeURIComponent(a) + ".png" : null;
}

/* Chamar pelo nome muda tudo aos 4 anos, mas repetir em toda frase
   vira ruído. Entra em parte das vezes, o suficiente para ela sentir
   que é com ela que estão falando. */
function comNome(frase, sempre){
  const n = nomeDela();
  if(!n) return frase;
  if(!sempre && Math.random() > 0.55) return frase;
  return frase.replace(/[!.]?$/, "") + ", " + n + "!";
}

/* ---------- missão do dia ---------- */
function missao(){ return perfil().missao; }

/* Chame ao terminar uma rodada de qualquer jogo.
   Devolve {feitos, total, completouAgora}. */
function concluiuDesafio(){
  const p = perfil();
  if(p.missao.feitos >= DESAFIOS_POR_DIA){
    return { feitos: p.missao.feitos, total: DESAFIOS_POR_DIA, completouAgora: false };
  }
  p.missao.feitos++;
  const completouAgora = (p.missao.feitos === DESAFIOS_POR_DIA);
  salvaPerfil(p);
  return { feitos: p.missao.feitos, total: DESAFIOS_POR_DIA, completouAgora };
}

/* ---------- fita de estrelas da missão ---------- */
/* Ela não lê "2 de 3". Três estrelas, sendo duas acesas, ela entende. */
function fitaDaMissao(){
  const m = missao();
  let html = '<div class="fita-missao">';
  for(let i = 0; i < DESAFIOS_POR_DIA; i++){
    html += '<span class="estrela-missao' + (i < m.feitos ? " acesa" : "") + '">★</span>';
  }
  html += '</div>';
  return html;
}

function injetaEstiloPerfil(){
  if(document.getElementById("estiloPerfil")) return;
  const s = document.createElement("style");
  s.id = "estiloPerfil";
  s.textContent = `
    .fita-missao{ display:flex; gap:6px; }
    .estrela-missao{
      font-size:26px; line-height:1; color:#D8CBEC;
      text-shadow:0 2px 0 rgba(255,255,255,.9);
      transition:color .3s ease, transform .3s ease;
    }
    .estrela-missao.acesa{
      color:#FFC93C;
      text-shadow:0 0 10px rgba(255,201,60,.9), 0 2px 0 rgba(255,255,255,.9);
      animation:estrelaAcende .5s cubic-bezier(.2,1.6,.4,1) both;
    }
    @keyframes estrelaAcende{
      0%  { transform:scale(.4) rotate(-30deg); }
      100%{ transform:scale(1)  rotate(0); }
    }
  `;
  document.head.appendChild(s);
}

/* ---------- a comemoração de fechar a missão do dia ----------
   É o fim que faltava. Sem um encerramento, a sessão nunca "acaba"
   e vira repetição sem sentido. Aqui ela ganha um momento de chegada. */
function festejaMissao(){
  injetaEstiloPerfil();
  if(!document.getElementById("estiloFesta")){
    const s = document.createElement("style");
    s.id = "estiloFesta";
    s.textContent = `
      #festaMissao{
        position:fixed; inset:0; z-index:300; display:flex;
        align-items:center; justify-content:center; flex-direction:column;
        gap:14px; padding:24px; text-align:center;
        font-family:'Baloo 2','Segoe UI Rounded',system-ui,sans-serif;
        background:radial-gradient(circle at 50% 40%, #FFF6D8 0%, #FFE3F0 55%, #E9DBFF 100%);
      }
      #festaMissao .medalha{
        width:min(56vw,210px); aspect-ratio:1; border-radius:50%;
        border:8px solid #FFC93C; background:#fff; overflow:hidden;
        box-shadow:0 0 0 10px rgba(255,201,60,.28), 0 14px 34px rgba(107,63,191,.3);
        animation:medalhaEntra .6s cubic-bezier(.2,1.5,.4,1) both;
      }
      #festaMissao .medalha img{ width:100%; height:100%; object-fit:cover; object-position:center 34%; }
      @keyframes medalhaEntra{
        0%  { transform:scale(.3) rotate(-25deg); opacity:0; }
        100%{ transform:scale(1) rotate(0); opacity:1; }
      }
      #festaMissao h2{ font-size:clamp(28px,9vw,44px); color:#6B3FBF; text-shadow:0 3px 0 #fff; }
      #festaMissao p{ font-size:17px; color:#8A6FBF; }
      #festaMissao .botao{
        border:none; border-radius:24px; cursor:pointer; font-family:inherit;
        font-weight:800; font-size:21px; color:#fff; padding:16px 32px;
        background:linear-gradient(180deg,#FF6FB0,#E3488F); box-shadow:0 5px 0 #C43A79;
      }
    `;
    document.head.appendChild(s);
  }

  const cx = document.createElement("div");
  cx.id = "festaMissao";
  const foto = imgDaAmiga();
  cx.innerHTML =
    '<div class="medalha">' + (foto ? '<img src="' + foto + '" alt="">' : '🏆') + '</div>' +
    '<h2>Missão cumprida!</h2>' +
    '<p>' + (nomeDela() ? nomeDela() + ' fez as ' : 'Você fez as ') + DESAFIOS_POR_DIA + ' brincadeiras de hoje</p>' +
    fitaDaMissao() +
    '<button class="botao" id="festaMissaoOk">Continuar brincando</button>';
  document.body.appendChild(cx);

  if(typeof somVitoria === "function") try{ somVitoria(); }catch(e){}
  setTimeout(() => {
    if(typeof fala === "function") try{
      fala(comNome("Missão de hoje cumprida", true) + " Você fez as três brincadeiras!");
    }catch(e){}
  }, 400);

  document.getElementById("festaMissaoOk").addEventListener("click", () => cx.remove());
}

/* ============================================================
   DIAGNÓSTICO DE ANIMAÇÃO

   Já convertemos tudo para transform e opacity, que rodam na placa
   de vídeo. Se ainda assim ficar estático no celular, a causa está
   fora do código: o sistema desligou animação.

   Duas configurações fazem isso:
     - "Reduzir movimento", em Acessibilidade
     - economia de bateria, no Android e no iOS

   Em vez de adivinhar, medimos: perguntamos ao navegador se a
   preferência está ligada, e escutamos se ALGUMA animação chegou a
   começar. As duas respostas aparecem na tela.

   E deixamos uma chave: o pai pode forçar as animações mesmo com a
   preferência ligada, porque quem ligou foi ele, não a criança.
   ============================================================ */

const ANIM_CHAVE = "poneis.animacao.forcada";

function animacaoForcada(){
  try{ return localStorage.getItem(ANIM_CHAVE) === "1"; }catch(e){ return false; }
}

function aplicaForcaAnimacao(){
  if(animacaoForcada()) document.documentElement.classList.add("animar-sempre");
  else document.documentElement.classList.remove("animar-sempre");
}
aplicaForcaAnimacao();

/* O diagnóstico automático de animação foi removido.

   Ele media se alguma animação começava e, não detectando nada, mostrava
   uma barra fixa por cima da tela. No celular deu falso positivo e passou
   a cobrir o labirinto — ferramenta de investigação não pode atrapalhar
   quem está jogando.

   A chave de forçar animação continua valendo: quem já ligou continua
   com ela ligada. Para ligar ou desligar, mude a chave
   "poneis.animacao.forcada" para "1" ou "0" no armazenamento do navegador.
*/

/* ---------- progresso do labirinto ----------
   O nível voltava a 1 a cada abertura da página, então quem voltasse
   ao menu entre uma fase e outra nunca passava do labirinto 2 — e as
   rodadas especiais, que dependem da contagem, nunca chegavam. */
const LAB_CHAVE = "poneis.labirinto.nivel";

function nivelSalvo(){
  try{
    const n = parseInt(localStorage.getItem(LAB_CHAVE), 10);
    return (n >= 1 && n <= 99) ? n : 1;
  }catch(e){ return 1; }
}

function salvaNivel(n){
  try{ localStorage.setItem(LAB_CHAVE, String(n)); }catch(e){}
}
