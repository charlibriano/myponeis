/* ============================================================
   ESTADO E LÓGICA
   ============================================================ */
const el = id => document.getElementById(id);
let estrelas = 0, rodada = 0, alvo = null, travado = false;

/* a seleção de voz saiu junto com as falas */

function marcaStatus(){}   // o botão de status da voz foi removido

function avisa(txt){
  const r = el('recado');
  if(!txt){ r.classList.add('escondida'); return; }
  r.textContent = txt;
  r.classList.remove('escondida');
}
el('recado').addEventListener('click', ()=>avisa(''));

/* As falas foram removidas do jogo. A função continua existindo, vazia,
   porque é chamada em dezenas de lugares — arrancar cada chamada daria
   mais risco de quebrar do que ganho. */
function fala(){}

function testaVoz(){}   // falas removidas do jogo

/* --- sons curtinhos --- */
let ctx = null;
function bip(freqs, dur=.12){
  try{
    ctx = ctx || new (window.AudioContext||window.webkitAudioContext)();
    freqs.forEach((f,i)=>{
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type='triangle'; o.frequency.value=f;
      const t = ctx.currentTime + i*dur;
      g.gain.setValueAtTime(.0001,t);
      g.gain.exponentialRampToValueAtTime(.25,t+.02);
      g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+dur+.02);
    });
  }catch(e){}
}

/* --- sorteio --- */
const sorteia = arr => arr[Math.floor(Math.random()*arr.length)];
/* Com true, o jogo só usa pôneis que têm imagem de verdade, para ficar
   igual ao jogo da memória. Vira false para voltar a aceitar os desenhados
   em SVG (útil enquanto faltarem imagens de personagens que ela ama). */
const SO_COM_IMAGEM = true;

/* Um acerto solto é curto demais para valer um desafio da missão.
   A cada 5 acertos o jogo credita um, o que dá tempo de brincadeira
   parecido com uma rodada de memória ou um labirinto. */
function contaDesafio(){
  if(typeof concluiuDesafio !== "function") return;
  if(estrelas === 0 || estrelas % 5 !== 0) return;
  const m = concluiuDesafio();
  if(m.completouAgora && typeof festejaMissao === "function") setTimeout(festejaMissao, 900);
}

function elenco(){
  const n = estrelas < 6 ? 1 : (estrelas < 16 ? 2 : 3);
  const grupo = PONEIS.filter(p => p.nivel <= n);
  if(!SO_COM_IMAGEM) return grupo;
  const comImagem = grupo.filter(p => imagemDe(p));
  // se sobrar pouca gente com imagem, prefere jogar a travar
  return comImagem.length >= 3 ? comImagem : grupo;
}
function quantasCartas(){
  if(rodada <= 3) return 2;
  if(rodada <= 8) return 3;
  if(rodada <= 14) return 4;
  return 6;
}

function novaRodada(){
  travado = false;
  rodada++;
  const grupo = elenco();
  const qtd = Math.min(quantasCartas(), grupo.length);
  const opcoes = [];
  while(opcoes.length < qtd){
    const p = sorteia(grupo);
    if(!opcoes.includes(p)) opcoes.push(p);
  }
  alvo = sorteia(opcoes);

  el('artigo').textContent = alvo.art;
  el('nome').textContent = alvo.nome;

  const cartas = el('cartas');
  cartas.className = 'cartas' + (qtd===2 ? ' duas' : '');
  cartas.innerHTML = '';
  opcoes.forEach(p=>{
    const b = document.createElement('button');
    b.className = 'carta';
    b.setAttribute('aria-label', p.nome);
    b.innerHTML = retrato(p);
    b.addEventListener('click', ()=>responde(p, b));
    cartas.appendChild(b);
  });

  setTimeout(()=>fala('Cadê ' + alvo.art + ' ' + alvo.nome + '?'), 250);
}

function responde(p, botao){
  if(travado) return;
  if(p === alvo){
    travado = true;
    estrelas++;
    el('placar').textContent = estrelas;
    contaDesafio();
    botao.classList.add('certa');
    [...document.querySelectorAll('.carta')].forEach(c=>{ if(c!==botao) c.classList.add('apagada'); });
    bip([660,880,1180],.11);
    festa(botao);
    const elogios = ['Isso!','Muito bem!','Boa!','Você acertou!'];
    fala(sorteia(elogios) + ' ' + (alvo.art==='a'?'Essa é a ':'Esse é o ') + alvo.nome + '!');
    setTimeout(novaRodada, 2100);
  }else{
    botao.classList.remove('errada');
    void botao.offsetWidth;
    botao.classList.add('errada');
    bip([300,240],.14);
    fala('Tenta de novo. Cadê ' + alvo.art + ' ' + alvo.nome + '?');
  }
}

function festa(origem){
  const r = origem.getBoundingClientRect();
  const simbolos = ['⭐','✨','💖','🌈','💫'];
  for(let i=0;i<14;i++){
    const s = document.createElement('div');
    s.className = 'brilho';
    s.textContent = sorteia(simbolos);
    s.style.left = (r.left + r.width/2) + 'px';
    s.style.top  = (r.top + r.height/2) + 'px';
    s.style.setProperty('--dx', (Math.random()*240-120).toFixed(0)+'px');
    s.style.setProperty('--dy', (-Math.random()*200-40).toFixed(0)+'px');
    s.style.setProperty('--rot', (Math.random()*360-180).toFixed(0)+'deg');
    s.style.animationDelay = (Math.random()*.25).toFixed(2)+'s';
    document.body.appendChild(s);
    setTimeout(()=>s.remove(), 1500);
  }
}

/* --- vitrine da tela inicial --- */
function montaVitrine(){
  const p = sorteia(elenco());   // usa o mesmo filtro do jogo, senão a vitrine mostra SVG
  el('vitrine').innerHTML = retrato(p);
}
montaVitrine();
setInterval(()=>{ if(!el('inicio').classList.contains('escondida')) montaVitrine(); }, 2600);

/* ============================================================
   MODO 2 — QUEM SUMIU?
   Mostra um grupo de pôneis, um desaparece, ela diz quem era.
   ============================================================ */
let sTimers = [], sAlvo = null, sRodada = 0, sTravado = true, sGrupo = [], sMesa = [];
function limpaTimers(){ sTimers.forEach(clearTimeout); sTimers = []; }
function depois(fn, ms){ sTimers.push(setTimeout(fn, ms)); }

function quantosNaMesa(){
  if(sRodada <= 2) return 3;
  if(sRodada <= 5) return 4;
  if(sRodada <= 8) return 5;
  return 6;
}

/* ===================================================================
   ESCONDE-ESCONDE

   A versão anterior era recordação: olhe, memorize, aponte quem faltou.
   Isso é o que o jogo da memória já faz — mudava o enunciado, não a
   experiência. E terminava sempre numa fila de quadrados parados.

   Aqui a criança PROCURA. Os pôneis brincam no campo, um se esconde, e
   ela varre o cenário atrás da pista: o esconderijo certo balança de
   leve e deixa um rabinho à mostra. É atenção visual, e o achado é o
   prêmio — o mesmo mecanismo do esconde-esconde de verdade.
   =================================================================== */

const ESCONDERIJOS = [
  { id:"moita",  svg:'<ellipse cx="50" cy="66" rx="42" ry="30" fill="#4E9E5E"/><ellipse cx="30" cy="52" rx="24" ry="20" fill="#63BC72"/><ellipse cx="66" cy="50" rx="26" ry="21" fill="#5AAF69"/>' },
  { id:"arvore", svg:'<rect x="43" y="52" width="14" height="42" rx="4" fill="#8B5A2B"/><circle cx="50" cy="40" r="30" fill="#4E9E5E"/><circle cx="30" cy="50" r="19" fill="#63BC72"/><circle cx="70" cy="48" r="20" fill="#5AAF69"/>' },
  { id:"pedra",  svg:'<ellipse cx="50" cy="70" rx="40" ry="26" fill="#A9A5B8"/><ellipse cx="40" cy="58" rx="24" ry="18" fill="#C0BCCC"/>' },
  { id:"barril", svg:'<rect x="24" y="38" width="52" height="54" rx="10" fill="#C08A4A"/><rect x="24" y="50" width="52" height="8" fill="#8B5A2B"/><rect x="24" y="72" width="52" height="8" fill="#8B5A2B"/>' },
  { id:"feno",   svg:'<circle cx="50" cy="62" r="34" fill="#E8C46A"/><path d="M22 56q28-14 56 0M20 70q30-12 60 0" stroke="#C9A44A" stroke-width="4" fill="none"/>' },
  { id:"casa",   svg:'<path d="M50 14 96 52H4Z" fill="#E0614F"/><rect x="16" y="52" width="68" height="42" rx="5" fill="#F6E7C8" stroke="#C9A87A" stroke-width="3"/><rect x="40" y="64" width="20" height="30" rx="9" fill="#8B5A2B"/>' }
];

let sEsconderijo = null;

/* estilos do campo, injetados daqui para não mexer no CSS do projeto */
(function estiloCampo(){
  if(document.getElementById('estiloCampo')) return;
  const st = document.createElement('style');
  st.id = 'estiloCampo';
  st.textContent = `
    #tabuleiro.campo{
      position:relative; display:block; overflow:hidden;
      min-height:230px; border-radius:22px;
      box-shadow:inset 0 3px 10px rgba(80,120,160,.18);
    }
    #tabuleiro.campo .ceuCampo{
      position:absolute; inset:0;
      background:linear-gradient(180deg,#BFE8FF 0%, #E6F6FF 100%);
    }
    #tabuleiro.campo .grama{
      position:absolute; left:0; right:0; bottom:0; height:56%;
      background:linear-gradient(180deg,#8FD68F 0%, #64B96A 100%);
      border-top:4px solid #5FAE63; border-radius:0 0 20px 20px;
    }

    /* os esconderijos ficam na linha do chão */
    #tabuleiro.campo .esconderijos{
      position:absolute; left:2%; right:2%; bottom:6%;
      display:flex; align-items:flex-end; justify-content:space-around; gap:2%;
      z-index:3;
    }
    #tabuleiro.campo .esconderijo{
      position:relative; flex:1 1 0; max-width:104px; aspect-ratio:1;
      border:none; background:none; padding:0; cursor:pointer;
      transition:transform .12s ease;
    }
    #tabuleiro.campo .esconderijo svg{ width:100%; height:100%; display:block; }
    #tabuleiro.campo .esconderijo:active{ transform:scale(.94); }

    /* A PISTA: o esconderijo certo balança de leve e deixa um rabinho
       à mostra. É o que transforma sorte em observação. */
    #tabuleiro.campo .esconderijo.temPonei{ animation:moitaMexe 2.6s ease-in-out infinite; }
    @keyframes moitaMexe{
      0%,72%,100%{ transform:rotate(0); }
      78%        { transform:rotate(-4deg); }
      86%        { transform:rotate(4deg); }
      92%        { transform:rotate(-2deg); }
    }
    #tabuleiro.campo .rabinho{ display:none; }
    #tabuleiro.campo .esconderijo.temPonei .rabinho{
      display:block; position:absolute; right:4%; bottom:26%;
      width:22%; height:12%; border-radius:0 60% 60% 0;
      background:var(--corRabo, #FF6FB0);
      box-shadow:0 2px 4px rgba(40,80,60,.35);
      animation:raboAbana 2.6s ease-in-out infinite;
      z-index:2;
    }
    @keyframes raboAbana{
      0%,72%,100%{ transform:rotate(0) translateX(0); }
      80%        { transform:rotate(-16deg) translateX(3px); }
      88%        { transform:rotate(12deg) translateX(3px); }
    }
    #tabuleiro.campo .esconderijo.achou{ animation:none; }
    #tabuleiro.campo .esconderijo.vazio{ animation:moitaSacode .45s ease-in-out; }
    @keyframes moitaSacode{
      0%,100%{ transform:translateX(0); }
      25%    { transform:translateX(-7px) rotate(-4deg); }
      75%    { transform:translateX(7px) rotate(4deg); }
    }
    #tabuleiro.campo .borboleta{
      position:absolute; left:50%; top:10%; font-size:22px; pointer-events:none;
      animation:borboletaVoa 1.2s ease-out forwards;
    }
    @keyframes borboletaVoa{
      from{ transform:translate(0,0) scale(.6); opacity:1; }
      to  { transform:translate(30px,-60px) scale(1.1); opacity:0; }
    }

    /* os pôneis brincando na frente */
    #tabuleiro.campo .brincando{
      position:absolute; left:6%; right:6%; top:6%;
      display:flex; justify-content:center; gap:6%;
      z-index:4;
    }
    #tabuleiro.campo .poneiCampo{
      width:20%; max-width:72px; aspect-ratio:1;
      animation:pulinho 1.1s ease-in-out infinite alternate;
      transition:transform .45s ease, opacity .4s ease;
    }
    #tabuleiro.campo .poneiCampo img{
      width:100%; height:100%; border-radius:50%;
      object-fit:cover; object-position:center 34%;
      border:3px solid #fff; box-sizing:border-box;
      box-shadow:0 3px 8px rgba(40,80,60,.35);
    }
    #tabuleiro.campo .poneiCampo svg{ width:100%; height:100%; }
    @keyframes pulinho{
      from{ transform:translateY(0)    rotate(-3deg); }
      to  { transform:translateY(-16%) rotate(3deg); }
    }
    #tabuleiro.campo .poneiCampo.escondeu{ transform:scale(.2) translateY(120%); opacity:0; }
    #tabuleiro.campo .esconderijo .poneiCampo.surgindo{
      position:absolute; left:50%; top:-32%; width:74%; max-width:none;
      transform:translateX(-50%);
      animation:surgePonei .6s cubic-bezier(.2,1.6,.4,1) both, pulinho 1.1s ease-in-out infinite alternate .6s;
      z-index:5;
    }
    @keyframes surgePonei{
      0%  { transform:translateX(-50%) scale(.2) translateY(60%); opacity:0; }
      100%{ transform:translateX(-50%) scale(1) translateY(0); opacity:1; }
    }

    /* a rajada de folhas que cobre a cena */
    #tabuleiro.campo .rajada{ position:absolute; inset:0; z-index:6; pointer-events:none; }
    #tabuleiro.campo .rajada span{
      position:absolute; left:-12%;
      animation:folhaCruza 1.4s linear forwards;
    }
    @keyframes folhaCruza{
      from{ transform:translateX(0) rotate(0); opacity:0; }
      20% { opacity:1; }
      to  { transform:translateX(130vw) rotate(540deg); opacity:0; }
    }
  `;
  document.head.appendChild(st);
})();


function quantosEsconderijos(){
  if(sRodada <= 2) return 3;
  if(sRodada <= 5) return 4;
  return 5;
}

function novaRodadaSumiu(){
  limpaTimers();
  sTravado = true;
  sRodada++;
  sGrupo = elenco();

  const n = Math.min(3, sGrupo.length);
  sMesa = [];
  while(sMesa.length < n){
    const p = sorteia(sGrupo);
    if(!sMesa.includes(p)) sMesa.push(p);
  }
  sAlvo = sorteia(sMesa);

  el('balaoSumiu').textContent = 'Os pôneis estão brincando…';
  el('rotuloOpcoes').textContent = '';
  el('opcoes').innerHTML = '';

  montaCampo();

  // 1. todos brincando à vista
  depois(()=>{ el('balaoSumiu').textContent = 'Um vai se esconder!'; }, 2200);

  // 2. uma rajada de folhas cobre o campo
  depois(()=> rajada(), 3400);

  // 3. o pônei sumiu; começa a procura
  depois(()=>{
    el('balaoSumiu').textContent = 'Cadê ' + (sAlvo.art === 'a' ? 'a ' : 'o ') + sAlvo.nome + '?';
    el('rotuloOpcoes').textContent = 'Procure onde ele se escondeu';
    sTravado = false;
    piscaPista();
  }, 4600);
}

function montaCampo(){
  const campo = el('tabuleiro');
  campo.innerHTML = '';
  campo.classList.add('campo');

  campo.insertAdjacentHTML('beforeend', '<div class="ceuCampo"></div><div class="grama"></div>');

  // os esconderijos, sorteados sem repetir
  const lista = ESCONDERIJOS.slice().sort(()=>Math.random()-.5).slice(0, quantosEsconderijos());
  sEsconderijo = sorteia(lista).id;

  const fila = document.createElement('div');
  fila.className = 'esconderijos';
  lista.forEach(e=>{
    const b = document.createElement('button');
    b.className = 'esconderijo';
    b.dataset.id = e.id;
    b.innerHTML =
      '<span class="rabinho"></span>' +
      '<svg viewBox="0 0 100 100">' + e.svg + '</svg>';
    b.addEventListener('click', ()=> procura(b));
    fila.appendChild(b);
  });
  campo.appendChild(fila);

  // os pôneis brincando na frente
  const brincando = document.createElement('div');
  brincando.className = 'brincando';
  sMesa.forEach((p, i)=>{
    const d = document.createElement('div');
    d.className = 'poneiCampo';
    d.dataset.nome = p.nome;
    d.style.animationDelay = (i * .21) + 's';
    d.innerHTML = retrato(p);
    brincando.appendChild(d);
  });
  campo.appendChild(brincando);
}

/* a rajada de folhas: cobre a cena e leva um pônei junto */
function rajada(){
  const campo = el('tabuleiro');
  const r = document.createElement('div');
  r.className = 'rajada';
  for(let i = 0; i < 14; i++){
    const f = document.createElement('span');
    f.textContent = sorteia(['🍃','🌿','🍂']);
    f.style.top = (Math.random() * 80) + '%';
    f.style.animationDelay = (Math.random() * .5) + 's';
    f.style.fontSize = (16 + Math.random() * 14) + 'px';
    r.appendChild(f);
  }
  campo.appendChild(r);
  bip([520, 660], .1);

  depois(()=>{
    const alvoEl = campo.querySelector('.poneiCampo[data-nome="' + sAlvo.nome + '"]');
    if(alvoEl) alvoEl.classList.add('escondeu');
  }, 450);

  depois(()=> r.remove(), 1600);
}

/* a pista: o esconderijo certo balança e mostra um rabinho */
function piscaPista(){
  const certo = document.querySelector('#tabuleiro .esconderijo[data-id="' + sEsconderijo + '"]');
  if(!certo) return;
  certo.classList.add('temPonei');
  certo.style.setProperty('--corRabo', sAlvo.crina && sAlvo.crina[0] ? sAlvo.crina[0] : '#FF6FB0');
}

function procura(botao){
  if(sTravado) return;

  if(botao.dataset.id === sEsconderijo){
    sTravado = true;
    estrelas++;
    el('placar').textContent = estrelas;
    contaDesafio();

    botao.classList.add('achou');
    const surge = document.createElement('div');
    surge.className = 'poneiCampo surgindo';
    surge.innerHTML = retrato(sAlvo);
    botao.appendChild(surge);

    bip([660, 880, 1180], .11);
    festa(botao);
    el('balaoSumiu').textContent = 'Achou!';
    el('rotuloOpcoes').textContent = '';
    depois(novaRodadaSumiu, 2600);

  }else{
    // errar não pune: sai uma borboleta e o esconderijo balança
    botao.classList.remove('vazio');
    void botao.offsetWidth;
    botao.classList.add('vazio');
    const b = document.createElement('span');
    b.className = 'borboleta';
    b.textContent = sorteia(['🦋','🐝','🐞']);
    botao.appendChild(b);
    depois(()=> b.remove(), 1200);
    bip([300, 240], .12);
  }
}

/* respondeSumiu saiu junto com a fila de opções: agora a resposta é
   procurar no cenário, tratada em procura(). */


/* --- botões --- */
el('btnJogar').addEventListener('click', ()=>{
  el('inicio').classList.add('escondida');
  el('jogo').classList.remove('escondida');
  el('btnCasa').classList.remove('escondida');
  setTimeout(novaRodada, 600);   // 1400 era espera da fala de abertura
});

/* O botão de status da voz e o de repetir a fala não têm mais função:
   as falas foram removidas. Some com os dois em vez de deixá-los na
   tela sem fazer nada — o de status ainda mostrava um diagnóstico de
   voz por cima do jogo. */
['btnStatus', 'btnFalar'].forEach(id => {
  const b = el(id);
  if(b) b.style.display = 'none';
});
el('btnSumiu').addEventListener('click', ()=>{
  el('inicio').classList.add('escondida');
  el('sumiu').classList.remove('escondida');
  el('btnCasa').classList.remove('escondida');
  sRodada = 0;
  testaVoz();
  depois(novaRodadaSumiu, 1400);
});

/* ---------- entrada direta a partir do menu ----------
   O menu tem um botão para cada modo, e antes os dois caíam nesta
   tela de escolha, obrigando a criança a escolher duas vezes.
   Agora o endereço diz qual modo abrir: ?modo=cade ou ?modo=sumiu.

   Guardamos se veio assim para o botão de casa devolver ao menu dos
   jogos, e não a esta tela intermediária que ela nunca viu. */
const modoDireto = new URLSearchParams(location.search).get('modo');

if(modoDireto === 'cade' || modoDireto === 'sumiu'){
  // o clique programático reusa exatamente o mesmo caminho do botão
  setTimeout(()=>{
    el(modoDireto === 'cade' ? 'btnJogar' : 'btnSumiu').click();
  }, 60);
}

el('btnCasa').addEventListener('click', ()=>{
  // veio direto do menu? então casa é o menu, não a tela de escolha
  if(modoDireto === 'cade' || modoDireto === 'sumiu'){
    location.href = 'index.html';
    return;
  }
  travado = true;
  sTravado = true;
  limpaTimers();
  el('jogo').classList.add('escondida');
  el('sumiu').classList.add('escondida');
  el('inicio').classList.remove('escondida');
  el('btnCasa').classList.add('escondida');
  rodada = 0;
  sRodada = 0;
});


/* --- aviso discreto de quais pôneis ainda estão sem imagem --- */
(function mostraRelatorio(){
  const alvo = el('relatorio');
  if(!alvo) return;
  const r = relatorioImagens();
  if(r.com === 0){ alvo.textContent = 'Desenhos em SVG (nenhuma imagem carregada ainda)'; return; }
  if(r.sem.length === 0){ alvo.textContent = r.com + ' pôneis com imagem'; return; }
  alvo.textContent = r.com + '/' + r.total + ' com imagem — toque para ver quem falta';
  alvo.style.cursor = 'pointer';
  alvo.addEventListener('click', ()=>avisa('Sem imagem (usando desenho): ' + r.sem.join(', ')));
})();
