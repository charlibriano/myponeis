/* ============================================================
   ESTADO E LÓGICA
   ============================================================ */
const el = id => document.getElementById(id);
let estrelas = 0, rodada = 0, alvo = null, travado = false;

/* --- voz --- */
const TEM_VOZ = ('speechSynthesis' in window);
let vozBR = null, jaFalou = false;

function escolheVoz(){
  if(!TEM_VOZ) return;
  const vozes = speechSynthesis.getVoices();
  vozBR = vozes.find(v=>v.lang==='pt-BR')
       || vozes.find(v=>v.lang && v.lang.replace('_','-').startsWith('pt'))
       || null;
}
if(TEM_VOZ){
  escolheVoz();
  speechSynthesis.onvoiceschanged = escolheVoz;
}

function marcaStatus(txt, ok){
  const b = el('btnStatus');
  b.textContent = txt;
  b.dataset.ok = ok;
}
function avisa(txt){
  const r = el('recado');
  if(!txt){ r.classList.add('escondida'); return; }
  r.textContent = txt;
  r.classList.remove('escondida');
}
el('recado').addEventListener('click', ()=>avisa(''));

function fala(texto){
  if(!TEM_VOZ){
    marcaStatus('🔇 sem voz','nao');
    avisa('Este navegador não tem voz. Abra o jogo no Chrome ou no Safari.');
    return;
  }
  try{
    // só cancela se realmente houver algo tocando (cancelar à toa mata a fala no iPhone)
    if(speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    speechSynthesis.resume();
    const f = new SpeechSynthesisUtterance(texto);
    f.lang = 'pt-BR'; f.rate = .85; f.pitch = 1.2;
    if(vozBR) f.voice = vozBR;
    f.onstart = ()=>{ jaFalou = true; marcaStatus('🔊 voz ok','sim'); avisa(''); };
    f.onerror = e => {
      marcaStatus('🔇 sem voz','nao');
      avisa('A voz falhou (' + (e.error || 'motivo desconhecido') + '). Toque aqui para fechar, ou no botão "sem voz" para ver os detalhes.');
    };
    speechSynthesis.speak(f);
  }catch(e){
    marcaStatus('🔇 sem voz','nao');
    avisa('A voz falhou: ' + e.message);
  }
}

/* teste feito dentro do toque real do dedo — é o que destrava o áudio no celular */
function testaVoz(){
  jaFalou = false;
  fala('Vamos brincar!');
  setTimeout(()=>{
    if(jaFalou) return;
    marcaStatus('🔇 sem voz','nao');
    const nVozes = TEM_VOZ ? speechSynthesis.getVoices().length : 0;
    if(nVozes === 0){
      avisa('O aparelho não tem nenhuma voz instalada. No Android: Configurações → Acessibilidade → Saída de texto para fala → instalar o idioma Português (Brasil).');
    }else if(!vozBR){
      avisa('O aparelho tem ' + nVozes + ' vozes, mas nenhuma em português. Instale o Português (Brasil) na saída de texto para fala.');
    }else{
      avisa('A voz não saiu. Verifique: 1) o jogo precisa estar aberto no Chrome ou Safari, não dentro de outro aplicativo; 2) no iPhone, desligue a chavinha de silencioso; 3) volume da mídia no máximo.');
    }
  }, 2200);
}

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
function elenco(){
  const n = estrelas < 6 ? 1 : (estrelas < 16 ? 2 : 3);
  return PONEIS.filter(p => p.nivel <= n);
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
  const p = sorteia(PONEIS.filter(x=>x.nivel===1));
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

function novaRodadaSumiu(){
  limpaTimers();
  sTravado = true;
  sRodada++;
  sGrupo = elenco();
  const n = Math.min(quantosNaMesa(), sGrupo.length - 2);
  sMesa = [];
  while(sMesa.length < n){
    const p = sorteia(sGrupo);
    if(!sMesa.includes(p)) sMesa.push(p);
  }
  sAlvo = sorteia(sMesa);

  el('balaoSumiu').textContent = 'Olha bem…';
  el('rotuloOpcoes').textContent = '';
  el('opcoes').innerHTML = '';

  const mesa = el('tabuleiro');
  mesa.innerHTML = '';
  sMesa.forEach(p=>{
    const d = document.createElement('div');
    d.className = 'carta fixa';
    d.dataset.nome = p.nome;
    d.innerHTML = retrato(p);
    mesa.appendChild(d);
  });

  fala('Olha bem nos pôneis!');

  depois(()=>{
    const alvoEl = [...mesa.children].find(c => c.dataset.nome === sAlvo.nome);
    if(alvoEl){
      bip([520,380],.12);
      festa(alvoEl);
      alvoEl.classList.add('sumindo');
      depois(()=>{
        alvoEl.classList.remove('sumindo','fixa');
        alvoEl.classList.add('vazia');
        alvoEl.innerHTML = '<span class="interrogacao">?</span>';
      }, 520);
    }
    depois(()=>{
      el('balaoSumiu').textContent = 'Quem sumiu?';
      el('rotuloOpcoes').textContent = 'Toque no pônei que faltou';
      fala('Quem sumiu?');
      montaOpcoes();
      sTravado = false;
    }, 900);
  }, 4500);
}

function montaOpcoes(){
  const escolhas = [sAlvo];
  const fora = sGrupo.filter(p => !sMesa.includes(p));
  while(escolhas.length < 3 && escolhas.length - 1 < fora.length){
    const p = sorteia(fora);
    if(!escolhas.includes(p)) escolhas.push(p);
  }
  escolhas.sort(()=>Math.random()-.5);

  const box = el('opcoes');
  box.innerHTML = '';
  escolhas.forEach(p=>{
    const b = document.createElement('button');
    b.className = 'carta opcao';
    b.setAttribute('aria-label', p.nome);
    b.innerHTML = retrato(p);
    b.addEventListener('click', ()=>respondeSumiu(p, b));
    box.appendChild(b);
  });
}

function respondeSumiu(p, botao){
  if(sTravado) return;
  if(p === sAlvo){
    sTravado = true;
    estrelas++;
    el('placar').textContent = estrelas;
    botao.classList.add('certa');
    [...document.querySelectorAll('#opcoes .carta')].forEach(c=>{ if(c!==botao) c.classList.add('apagada'); });
    const vazia = document.querySelector('#tabuleiro .vazia');
    if(vazia){ vazia.classList.remove('vazia'); vazia.classList.add('fixa','certa'); vazia.innerHTML = retrato(sAlvo); }
    bip([660,880,1180],.11);
    festa(botao);
    fala(sorteia(['Isso!','Muito bem!','Boa!','Acertou!']) + ' ' + (sAlvo.art==='a'?'Era a ':'Era o ') + sAlvo.nome + '!');
    depois(novaRodadaSumiu, 2600);
  }else{
    botao.classList.remove('errada');
    void botao.offsetWidth;
    botao.classList.add('errada');
    bip([300,240],.14);
    fala('Esse não. Quem sumiu?');
  }
}

/* --- botões --- */
el('btnJogar').addEventListener('click', ()=>{
  el('inicio').classList.add('escondida');
  el('jogo').classList.remove('escondida');
  el('btnCasa').classList.remove('escondida');
  testaVoz();
  setTimeout(novaRodada, 1400);
});

el('btnStatus').addEventListener('click', ()=>{
  const n = TEM_VOZ ? speechSynthesis.getVoices().length : 0;
  const pt = TEM_VOZ
    ? speechSynthesis.getVoices().filter(v=>v.lang && v.lang.replace('_','-').startsWith('pt')).map(v=>v.name).slice(0,2).join(' / ')
    : '';
  avisa('Suporte a voz: ' + (TEM_VOZ ? 'sim' : 'não')
      + ' · vozes no aparelho: ' + n
      + ' · em português: ' + (pt || 'nenhuma')
      + ' · já falou alguma vez: ' + (jaFalou ? 'sim' : 'não')
      + '. Testando agora…');
  testaVoz();
});
el('btnFalar').addEventListener('click', ()=>{
  if(alvo) fala('Cadê ' + alvo.art + ' ' + alvo.nome + '?');
});
el('btnSumiu').addEventListener('click', ()=>{
  el('inicio').classList.add('escondida');
  el('sumiu').classList.remove('escondida');
  el('btnCasa').classList.remove('escondida');
  sRodada = 0;
  testaVoz();
  depois(novaRodadaSumiu, 1400);
});

el('btnCasa').addEventListener('click', ()=>{
  travado = true;
  sTravado = true;
  limpaTimers();
  if(TEM_VOZ) speechSynthesis.cancel();
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
