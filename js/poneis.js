
/* ============================================================
   PÔNEIS  —  cada um é desenhado em SVG na hora (nada de imagem
   externa, o jogo funciona offline e pesa quase nada)
   ============================================================ */
const PONEIS = [
  {nome:'Twilight Sparkle', art:'a', pelo:'#C7A8E8', crina:['#2E2450','#D14FA0','#8E5BD0','#2E2450','#D14FA0'], olho:'#A87FD8', tipo:'alicornio', nivel:1},
  {nome:'Rainbow Dash',     art:'a', pelo:'#A6DBF7', crina:['#E4574F','#F09A3E','#F5D94A','#5FBE6B','#4A8AD8'], olho:'#E0517E', tipo:'pegaso',    nivel:1},
  {nome:'Pinkie Pie',       art:'a', pelo:'#F7B5D2', crina:['#EC5FA6'], olho:'#74C4E8', tipo:'terrestre', nivel:1},
  {nome:'Fluttershy',       art:'a', pelo:'#FBF0A8', crina:['#F2A3C0'], olho:'#55B8A0', tipo:'pegaso',    nivel:1},
  {nome:'Rarity',           art:'a', pelo:'#F6F4F7', crina:['#5E3D9E'], olho:'#4C82C9', tipo:'unicornio', nivel:1},
  {nome:'Applejack',        art:'a', pelo:'#F5B75E', crina:['#F0DE9A'], olho:'#5CA96E', tipo:'terrestre', nivel:1, chapeu:true},

  {nome:'Princesa Celestia',art:'a', pelo:'#FFFDFA', crina:['#8FE3D6','#7FC2EA','#A9A6EA','#F3A0CC'], olho:'#C58FE0', tipo:'alicornio', nivel:2, coroa:true},
  {nome:'Princesa Luna',    art:'a', pelo:'#4E5DAE', crina:['#3C55B0','#5C7BD8','#7FA8E8'], olho:'#8FD8E0', tipo:'alicornio', nivel:2, coroa:true},
  {nome:'Princesa Cadance', art:'a', pelo:'#F7C6DA', crina:['#F0A8C8','#E88FBE','#F5E28C'], olho:'#8FB6E0', tipo:'alicornio', nivel:2, coroa:true},
  {nome:'Starlight Glimmer',art:'a', pelo:'#CBA9DC', crina:['#7E5FB4','#7FDCC4','#7E5FB4'], olho:'#6FC4C0', tipo:'unicornio', nivel:2},
  {nome:'Sunset Shimmer',   art:'a', pelo:'#F6B87E', crina:['#E4574F','#F5C24B'], olho:'#57B8A8', tipo:'unicornio', nivel:2},
  {nome:'Trixie',           art:'a', pelo:'#A9CDEC', crina:['#CBDCEE','#B4C9DE'], olho:'#9B7BD0', tipo:'unicornio', nivel:2},

  {nome:'Apple Bloom',      art:'a', pelo:'#F5E7A0', crina:['#E4574F'], olho:'#E08A3E', tipo:'terrestre', nivel:3, laco:'#E4548E'},
  {nome:'Sweetie Belle',    art:'a', pelo:'#F7F2F4', crina:['#E89BC8','#A87FD8'], olho:'#7EC48E', tipo:'unicornio', nivel:3},
  {nome:'Scootaloo',        art:'a', pelo:'#F5A85E', crina:['#C24E96'], olho:'#8E6FC4', tipo:'pegaso',    nivel:3},
  {nome:'Big McIntosh',     art:'o', pelo:'#E0736A', crina:['#F2C878'], olho:'#6FB07E', tipo:'terrestre', nivel:3},
  {nome:'Derpy',            art:'a', pelo:'#C9C9DA', crina:['#F2E09A'], olho:'#F5C24B', tipo:'pegaso',    nivel:3},
  {nome:'Maud Pie',         art:'a', pelo:'#ACA6B4', crina:['#5F5A68'], olho:'#6FA8C4', tipo:'terrestre', nivel:3}
];

/* ---------- utilidades de cor ---------- */
function mistura(hex, alvo, p){
  const n = parseInt(hex.slice(1),16);
  const a = parseInt(alvo.slice(1),16);
  const r = Math.round((n>>16&255)*(1-p) + (a>>16&255)*p);
  const g = Math.round((n>>8&255)*(1-p) + (a>>8&255)*p);
  const b = Math.round((n&255)*(1-p) + (a&255)*p);
  return '#' + (1<<24 | r<<16 | g<<8 | b).toString(16).slice(1);
}
const escurece = (c,p=.22) => mistura(c,'#2B1B44',p);
const clareia  = (c,p=.30) => mistura(c,'#FFFFFF',p);

/* ---------- desenho do pônei ---------- */
function desenhaPonei(p){
  const contorno = escurece(p.pelo,.30);
  const c = p.crina;
  const cor = i => c[i % c.length];

  // crina de trás: dois tufos atrás da cabeça
  let tras = '';
  [[46,112,-22],[154,112,22]].forEach((t,i)=>{
    tras += `<ellipse cx="${t[0]}" cy="${t[1]}" rx="26" ry="46" fill="${cor(i)}" transform="rotate(${t[2]} ${t[0]} ${t[1]})"/>`;
  });

  // orelhas
  const orelhas = [[64,52,-24],[136,52,24]].map(o=>
    `<g transform="rotate(${o[2]} ${o[0]} ${o[1]})">
       <ellipse cx="${o[0]}" cy="${o[1]}" rx="15" ry="21" fill="${p.pelo}" stroke="${contorno}" stroke-width="3"/>
       <ellipse cx="${o[0]}" cy="${o[1]+3}" rx="7" ry="11" fill="${mistura(p.pelo,'#E88FBE',.45)}"/>
     </g>`).join('');

  // asas
  let asas = '';
  if(p.tipo==='pegaso' || p.tipo==='alicornio'){
    const pena = clareia(p.pelo,.35);
    asas = [[30,124,-1],[170,124,1]].map(a=>{
      const s = a[2];
      return `<g transform="translate(${a[0]} ${a[1]}) scale(${s} 1)">
        <ellipse cx="0" cy="0"  rx="13" ry="30" fill="${pena}" stroke="${contorno}" stroke-width="3" transform="rotate(-16)"/>
        <ellipse cx="10" cy="6" rx="11" ry="25" fill="${clareia(p.pelo,.15)}" stroke="${contorno}" stroke-width="3" transform="rotate(-8)"/>
      </g>`;
    }).join('');
  }

  // franja: tufos em arco sobre a testa
  let franja = '';
  const angulos = [-62,-32,0,32,62];
  angulos.forEach((ang,i)=>{
    const rad = ang*Math.PI/180;
    const cx = 100 + Math.sin(rad)*42;
    const cy = 100 - Math.cos(rad)*40;
    franja += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="19" ry="28" fill="${cor(i)}" stroke="${escurece(cor(i),.18)}" stroke-width="2" transform="rotate(${ang} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
  });

  // chifre
  let chifre = '';
  if(p.tipo==='unicornio' || p.tipo==='alicornio'){
    chifre = `<path d="M100 14 L110 58 L90 58 Z" fill="${clareia(p.pelo,.25)}" stroke="${contorno}" stroke-width="3" stroke-linejoin="round"/>`;
  }

  // olhos
  const olho = (x)=>`
    <ellipse cx="${x}" cy="103" rx="15" ry="18" fill="#FFFFFF" stroke="${contorno}" stroke-width="2.5"/>
    <circle cx="${x}" cy="106" r="10" fill="${p.olho}"/>
    <circle cx="${x}" cy="106" r="5"  fill="#2B1B44"/>
    <circle cx="${x-4}" cy="101" r="4" fill="#FFFFFF"/>
    <circle cx="${x+4}" cy="111" r="2" fill="#FFFFFF" opacity=".8"/>`;

  // acessórios
  let extra = '';
  if(p.chapeu){
    extra += `<g><ellipse cx="100" cy="46" rx="66" ry="15" fill="#D8A45C" stroke="${escurece('#D8A45C',.25)}" stroke-width="3"/>
      <ellipse cx="100" cy="26" rx="34" ry="24" fill="#E8B96E" stroke="${escurece('#D8A45C',.25)}" stroke-width="3"/>
      <rect x="66" y="36" width="68" height="9" rx="4" fill="#B7854A"/></g>`;
  }
  if(p.coroa){
    extra += `<g><path d="M70 42 L82 20 L100 38 L118 20 L130 42 Z" fill="#F5D77A" stroke="#C9A24A" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="100" cy="26" r="5" fill="#7FC2EA" stroke="#C9A24A" stroke-width="2"/></g>`;
  }
  if(p.laco){
    extra += `<g transform="translate(150 58) rotate(14)">
      <path d="M0 0 L-24 -14 L-24 14 Z" fill="${p.laco}"/>
      <path d="M0 0 L24 -14 L24 14 Z" fill="${p.laco}"/>
      <circle cx="0" cy="0" r="8" fill="${escurece(p.laco,.15)}"/></g>`;
  }

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.nome}">
    ${asas}${tras}${orelhas}
    <ellipse cx="100" cy="100" rx="56" ry="54" fill="${p.pelo}" stroke="${contorno}" stroke-width="3.5"/>
    <ellipse cx="100" cy="140" rx="34" ry="27" fill="${p.pelo}"/>
    <ellipse cx="100" cy="140" rx="34" ry="27" fill="none" stroke="${contorno}" stroke-width="3.5" stroke-dasharray="52 90" stroke-dashoffset="-19"/>
    <ellipse cx="90" cy="140" rx="3" ry="4" fill="${escurece(p.pelo,.35)}"/>
    <ellipse cx="110" cy="140" rx="3" ry="4" fill="${escurece(p.pelo,.35)}"/>
    <path d="M92 152 Q100 160 108 152" fill="none" stroke="${escurece(p.pelo,.35)}" stroke-width="3" stroke-linecap="round"/>
    ${olho(74)}${olho(126)}
    ${franja}${chifre}${extra}
  </svg>`;
}



/* ============================================================
   RETRATO — usa a imagem baixada da wiki quando existir,
   senão cai no desenho SVG. Nada quebra se faltar imagem.
   ============================================================ */
function normaliza(s){
  return (s||'').toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'');
}

const MAPA_IMG = {};
(function montaMapa(){
  const lista = (typeof PERSONAGENS !== 'undefined' && Array.isArray(PERSONAGENS)) ? PERSONAGENS : [];
  lista.forEach(x => { if(x && x.nome && x.img) MAPA_IMG[normaliza(x.nome)] = x.img; });
})();

function imagemDe(p){ return MAPA_IMG[normaliza(p.nome)] || null; }

function semImagem(img, nome){
  const p = PONEIS.find(x => x.nome === nome);
  const pai = img.parentElement;
  if(p && pai) pai.innerHTML = desenhaPonei(p);
}

function retrato(p){
  const src = imagemDe(p);
  if(src){
    return '<img src="' + src + '" alt="' + p.nome + '" '
         + 'onerror="semImagem(this, \'' + p.nome + '\')">';
  }
  return desenhaPonei(p);
}

function relatorioImagens(){
  const sem = PONEIS.filter(p => !imagemDe(p)).map(p => p.nome);
  return { total: PONEIS.length, com: PONEIS.length - sem.length, sem: sem };
}
