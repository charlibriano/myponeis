/* ============================================================
   CATÁLOGO DE VOZ

   Cada item vira um arquivo de áudio em audio/<id>.mp3, gerado uma
   vez no computador com o Piper e enviado junto com o jogo. A partir
   daí a voz é sempre a mesma, em qualquer celular, sem depender de
   voz instalada e sem internet.

   Por que pedaços e não frases inteiras: o jogo fala coisas como
   "Cadê a Rarity?" — com 200 pôneis, seriam 200 arquivos só dessa
   frase. Gravando "Cadê a" e cada nome uma vez, 200 frases custam
   201 arquivos. O tocador emenda na hora.

   {nome}, {letra} e {n} são as lacunas. O gerador quebra a frase nos
   pedaços de cada lado da lacuna e gera <id>-ini e <id>-fim.

   O sufixo -ini/-fim não é enfeite: usei -a/-b antes e o pedaço inicial
   do molde "letra" virou "letra-a", que é o mesmo identificador do
   arquivo da letra A. "Letra A!" tocava o pedaço errado.
   ============================================================ */

/* ---------- frases inteiras, sem lacuna ---------- */
const FRASES = {
  "vamos-brincar":        "Vamos brincar!",
  "ache-iguais":          "Ache os dois pôneis iguais! Toque em uma cartinha.",
  "toque-cartinha":       "Toque em uma cartinha para virar.",
  "trancado":             "Está trancado! Acha a chavinha primeiro.",
  "chave-achada":         "Achou a chavinha! O portão abriu.",
  "achou-caminho":        "Muito bem! Você achou o caminho!",
  "arraste-dedo":         "Arraste o dedo pelo caminho, ou use as setinhas.",
  "ainda-nao-ganhou":     "Essa você ainda não ganhou!",
  "olha-bem":             "Olha bem nos pôneis!",
  "quem-sumiu":           "Quem sumiu?",
  "album-completo":       "Você já tem todas as pôneis do álbum! Que campeã!",
  "missao-cumprida":      "Missão de hoje cumprida! Você fez as três brincadeiras!",
  "estoura-baloes":       "Estoura os balões e escreve o seu nome!",
  "pegou-todas":          "Pegou todas!",
  "falta-uma":            "Falta uma.",

  /* elogios — sorteados, por isso vários */
  "elogio-1":             "Isso!",
  "elogio-2":             "Muito bem!",
  "elogio-3":             "Boa!",
  "elogio-4":             "Achou!",
  "elogio-5":             "Que legal!",
  "elogio-6":             "Você conseguiu!",

  /* incentivos — nunca punem, só chamam de volta */
  "incentivo-1":          "Tenta de novo.",
  "incentivo-2":          "Quase!",
  "incentivo-3":          "Procura mais um pouquinho.",
  "incentivo-4":          "Vai achar!"
};

/* ---------- frases com lacuna ----------
   O gerador cria um arquivo para cada pedaço fixo; o tocador emenda
   com o pedaço variável (nome de pônei, letra ou número). */
const MOLDES = [
  { id:"cade-a",        texto:"Cadê a {nome}?" },
  { id:"cade-o",        texto:"Cadê o {nome}?" },
  { id:"essa-e-a",      texto:"Essa é a {nome}!" },
  { id:"esse-e-o",      texto:"Esse é o {nome}!" },
  { id:"ganhou",        texto:"Você ganhou {nome}! Agora ela é sua." },
  { id:"chegou-ate",    texto:"O pônei chegou até {nome}!" },
  { id:"leva-ate",      texto:"Leva o pônei até {nome}!" },
  { id:"agora-letra",   texto:"Agora é a letra {letra}!" },
  { id:"letra",         texto:"Letra {letra}!" },
  { id:"comece-letra",  texto:"Comece pela letra {letra}." },
  { id:"faltam",        texto:"Faltam {n}." },
  { id:"vamos-para",    texto:"Agora vamos para {nome}!" }
];

/* ---------- pedaços variáveis ---------- */

/* as pôneis do álbum, mais as candidatas a amiga */
const NOMES_VOZ = [
  "Rarity","Princesa Celestia","Princesa Cadance","Princesa Ember","Flurry Heart",
  "Apple Bloom","Sweetie Belle","Scootaloo","Big McIntosh","Trixie","Diamond Tiara",
  "Silver Spoon","Cheerilee","Lyra Heartstrings","Octavia Melody","DJ Pon-3",
  "Babs Seed","Coco Pommel","Sunburst","Zephyr Breeze","Twist","Pipsqueak",
  "Gilda","Smolder","Winona","Tank","Owlowiscious","Rainha Chrysalis",
  "Discórdia","Rei Sombra","Tempest Shadow","Songbird Serenade"
];

/* os cenários do labirinto entram no molde "Agora vamos para {nome}" */
const LUGARES_VOZ = [
  "o jardim","a praia","a neve","a floresta","o mundo dos doces",
  "o castelo","o pôr do sol"
];

const LETRAS_VOZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const NUMEROS_VOZ = ["2","3","4","5","6","7","8"];

/* ---------- normalização ----------
   Compara o que o jogo pediu com o que existe no catálogo, ignorando
   acento, maiúscula e pontuação. Sem isso "Muito bem!" e "muito bem"
   virariam arquivos diferentes. */
function chaveDeVoz(txt){
  return String(txt)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9{} ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function idDeNome(nome){ return "nome-" + chaveDeVoz(nome).replace(/ /g, "-"); }
function idDeLetra(L){ return "letra-" + chaveDeVoz(L); }
function idDeNumero(n){ return "num-" + n; }


/* ============================================================
   VOZ GRAVADA  (audio/*.mp3)

   Quando existe arquivo para a frase, ele é tocado. Só quando não
   existe é que cai na voz do aparelho. Assim a voz é a mesma em
   qualquer celular, mesmo sem nenhuma voz instalada.

   Mora aqui, e não no voz.js, porque o "Cadê o Pônei?" usa a camada
   de voz antiga que vive no jogo.js e não carrega o voz.js. Como todas
   as páginas carregam o frases.js, o tocador fica disponível para as
   duas camadas sem duplicar código.
   ============================================================ */

const AUDIO_PASTA = "audio/";
let audioNaFila = [], audioTocando = null, audioDisponivel = null;

/* Descobre uma vez se a pasta de áudio existe. Enquanto não sabe,
   usa a voz do aparelho — nunca fica mudo esperando resposta. */
function testaAudio(){
  if(typeof FRASES === "undefined") { audioDisponivel = false; return; }
  const tenta = ext => {
    const a = new Audio(AUDIO_PASTA + "vamos-brincar" + ext);
    a.addEventListener("canplaythrough", () => { audioDisponivel = true; }, { once:true });
    a.addEventListener("error", () => {
      if(ext === ".mp3") tenta(".wav"); else audioDisponivel = false;
    }, { once:true });
    a.load();
  };
  tenta(".mp3");
}

/* Quebra a frase pedida na lista de arquivos que a reproduzem.
   Devolve null quando algum pedaço não existe — melhor cair inteiro
   na voz sintética que falar metade. */
function pedacosDaFrase(texto){
  if(typeof FRASES === "undefined") return null;
  const alvo = chaveDeVoz(texto);

  for(const id in FRASES){
    if(chaveDeVoz(FRASES[id]) === alvo) return [id];
  }

  for(const molde of MOLDES){
    const partes = chaveDeVoz(molde.texto).split(/\{(nome|letra|n)\}/);
    const antes = partes[0].trim(), tipo = partes[1], depois = (partes[2] || "").trim();
    if(!alvo.startsWith(antes) || !alvo.endsWith(depois)) continue;

    let meio = alvo.slice(antes.length, alvo.length - depois.length).trim();
    if(!meio) continue;

    if(tipo === "nome"){
      const achado = NOMES_VOZ.concat(LUGARES_VOZ).find(n => chaveDeVoz(n) === meio);
      if(achado) return [molde.id + "-ini", idDeNome(achado), molde.id + "-fim"];
    }else if(tipo === "letra"){
      const L = LETRAS_VOZ.find(x => chaveDeVoz(x) === meio);
      if(L) return [molde.id + "-ini", idDeLetra(L), molde.id + "-fim"];
    }else if(tipo === "n"){
      if(NUMEROS_VOZ.includes(meio)) return [molde.id + "-ini", idDeNumero(meio), molde.id + "-fim"];
    }
  }
  return null;
}

function paraAudio(){
  audioNaFila = [];
  if(audioTocando){ try{ audioTocando.pause(); }catch(e){} audioTocando = null; }
}

/* Aceita .mp3 e .wav: o gerador do Windows produz WAV, e converter
   para MP3 exigiria instalar mais um programa. Tenta MP3 primeiro,
   cai para WAV, e só então desiste daquele pedaço. */
function tocaArquivo(id, ext, aoFalhar){
  const a = new Audio(AUDIO_PASTA + id + ext);
  audioTocando = a;
  a.addEventListener("ended", tocaFila, { once:true });
  a.addEventListener("error", aoFalhar, { once:true });
  a.play().catch(aoFalhar);
}

function tocaFila(){
  if(!audioNaFila.length){ audioTocando = null; return; }
  const id = audioNaFila.shift();
  // pedaço faltando não pode travar a fila: pula e segue
  tocaArquivo(id, ".mp3", () => tocaArquivo(id, ".wav", tocaFila));
}

/* devolve true quando conseguiu tocar por arquivo */
function falaGravada(texto){
  if(audioDisponivel === false) return false;
  const ids = pedacosDaFrase(texto);
  if(!ids) return false;
  paraAudio();
  audioNaFila = ids.filter(Boolean);
  tocaFila();
  return true;
}

addEventListener("DOMContentLoaded", testaAudio);

