/* ============================================================
   VOZ E SOM  —  camada compartilhada
   Usada por index.html (menu) e memoria.html.
   O poneis.html tem a sua própria cópia dentro de js/jogo.js,
   que ficou intacta de propósito.

   Ela tem 4 anos e não lê. A voz não é enfeite: é a interface.

   Elementos opcionais na página (se não existirem, é ignorado):
     #btnStatus    botão que testa a voz
     #btnTrocaVoz  botão que passa para a próxima voz em português
     #recado       barra onde o erro aparece escrito
   ============================================================ */

const TEM_VOZ = ('speechSynthesis' in window);
let vozBR = null, jaFalou = false, vozConfirmadaFeminina = false;
let vozesPt = [], vozEscolhidaAMao = false;

/* nomes de voz feminina em pt que aparecem nos aparelhos mais comuns.
   Android expõe "...#female_1-local", iOS usa Luciana, Windows Maria/Francisca. */
const FEMININA  = /(luciana|joana|fernanda|camila|francisca|maria|thalita|brenda|helena|in[eê]s|catarina|vit[oó]ria|female|feminin|mulher|woman)/i;
const MASCULINA = /(felipe|daniel|ricardo|jo[aã]o|male|masculin|homem|eddy|reed|rocko|grandpa)/i;

const _el = id => document.getElementById(id);

function marcaFeminina(){
  vozConfirmadaFeminina = !!vozBR &&
    FEMININA.test((vozBR.name + ' ' + (vozBR.voiceURI || '')).toLowerCase());
}

function pontuaVoz(v){
  const lang = (v.lang || '').replace('_', '-').toLowerCase();
  let p;
  if(lang === 'pt-br')           p = 100;   // português do Brasil primeiro
  else if(lang.startsWith('pt')) p = 60;    // português de Portugal serve de reserva
  else return -1;

  const rotulo = (v.name + ' ' + (v.voiceURI || '')).toLowerCase();
  if(FEMININA.test(rotulo))  p += 50;
  if(MASCULINA.test(rotulo)) p -= 70;
  if(v.localService)         p += 5;        // voz local não depende de internet
  return p;
}

function escolheVoz(){
  if(!TEM_VOZ) return;
  vozesPt = speechSynthesis.getVoices()
    .map(v => ({ v, p: pontuaVoz(v) }))
    .filter(x => x.p >= 0)
    .sort((a, b) => b.p - a.p)
    .map(x => x.v);

  if(vozEscolhidaAMao && vozBR) return;   // respeita a troca feita à mão
  vozBR = vozesPt.length ? vozesPt[0] : null;
  marcaFeminina();
}
if(TEM_VOZ){ escolheVoz(); speechSynthesis.onvoiceschanged = escolheVoz; }

/* passa para a próxima voz em português instalada no aparelho */
function trocaVoz(){
  if(vozesPt.length < 2) return false;
  const i = vozesPt.indexOf(vozBR);
  vozBR = vozesPt[(i + 1) % vozesPt.length];
  vozEscolhidaAMao = true;
  marcaFeminina();
  return true;
}

function marcaStatus(txt, ok){
  const b = _el('btnStatus');
  if(!b) return;
  b.textContent = txt;
  b.dataset.ok = ok;
}

function avisa(txt){
  const r = _el('recado');
  if(!r) return;
  if(!txt){ r.classList.add('escondida'); return; }
  r.textContent = txt;
  r.classList.remove('escondida');
}

function fala(texto){
  if(!TEM_VOZ){
    marcaStatus('🔇 sem voz', 'nao');
    avisa('Este navegador não tem voz. Abra o jogo no Chrome ou no Safari.');
    return;
  }
  try{
    // só cancela se realmente houver algo tocando (cancelar à toa mata a fala no iPhone)
    if(speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    speechSynthesis.resume();
    const f = new SpeechSynthesisUtterance(texto);
    f.lang = 'pt-BR';
    f.rate = .85;
    // sem confirmar que a voz é feminina, o tom mais alto aproxima
    f.pitch = vozConfirmadaFeminina ? 1.15 : 1.35;
    if(vozBR) f.voice = vozBR;
    f.onstart = () => { jaFalou = true; marcaStatus('🔊 voz ok', 'sim'); avisa(''); };
    f.onerror = e => {
      marcaStatus('🔇 sem voz', 'nao');
      avisa('A voz falhou (' + (e.error || 'motivo desconhecido') + '). Toque aqui para fechar.');
    };
    speechSynthesis.speak(f);
  }catch(e){
    marcaStatus('🔇 sem voz', 'nao');
    avisa('A voz falhou: ' + e.message);
  }
}

/* o teste precisa rodar dentro do toque real do dedo — é o que destrava o áudio */
function testaVoz(frase){
  jaFalou = false;
  fala(frase || 'Oi! Vamos brincar com os pôneis?');
  if(vozBR){
    avisa('Voz em uso: ' + vozBR.name + ' (' + vozBR.lang + ')'
        + (vozesPt.length > 1
            ? ' · ' + vozesPt.length + ' vozes em português no aparelho. Toque em "trocar voz" para ouvir a próxima.'
            : ' · é a única voz em português instalada.'));
  }
  setTimeout(() => {
    if(jaFalou) return;
    marcaStatus('🔇 sem voz', 'nao');
    const n = TEM_VOZ ? speechSynthesis.getVoices().length : 0;
    if(n === 0){
      avisa('O aparelho não tem nenhuma voz instalada. No Android: Configurações → Acessibilidade → Saída de texto para fala → instalar o Português (Brasil).');
    }else if(!vozBR){
      avisa('O aparelho tem ' + n + ' vozes, mas nenhuma em português. Instale o Português (Brasil) na saída de texto para fala.');
    }else{
      avisa('A voz não saiu. Verifique: 1) o jogo precisa estar no Chrome ou Safari, não dentro de outro aplicativo; 2) no iPhone, desligue a chavinha de silencioso; 3) volume da mídia no máximo.');
    }
  }, 2200);
}

/* ---------- sons ---------- */
let ctx = null;
function bip(freqs, dur = .12){
  try{
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === 'suspended') ctx.resume();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      const t = ctx.currentTime + i * dur;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.25, t + .02);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + .02);
    });
  }catch(e){}
}

const somToque   = () => bip([700], .07);
const somAchou   = () => bip([784, 988, 1319], .12);
const somErrou   = () => bip([330, 262], .14);
const somVitoria = () => bip([523, 659, 784, 1047, 784, 1047], .15);
const somComeco  = () => bip([523, 659, 784], .10);

const ELOGIOS    = ['Isso!', 'Muito bem!', 'Boa!', 'Achou!', 'Que legal!', 'Você conseguiu!'];
const INCENTIVOS = ['Tenta de novo.', 'Quase!', 'Procura mais um pouquinho.', 'Vai achar!'];
const escolhe = a => a[Math.floor(Math.random() * a.length)];

/* liga os botões de voz, se a página tiver */
addEventListener('DOMContentLoaded', () => {
  const bs = _el('btnStatus'), bt = _el('btnTrocaVoz'), r = _el('recado');
  if(bs) bs.addEventListener('click', () => testaVoz());
  if(bt) bt.addEventListener('click', () => {
    if(trocaVoz()) testaVoz();
    else avisa('O aparelho só tem uma voz em português instalada.');
  });
  if(r) r.addEventListener('click', () => avisa(''));
});
