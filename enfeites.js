/* ============================================================
   ENFEITES DA AMIGA

   A figurinha do álbum é um prêmio finito: nas 32 acaba. E ela some
   dentro de uma página que a criança precisa abrir para ver.

   O enfeite é o oposto: a pônei amiga passa a usar o que foi ganho, e
   isso aparece no menu, toda vez que ela abre o jogo. O prêmio fica
   visível sem precisar procurar.

   Cada labirinto terminado dá um enfeite novo, enquanto houver.

   Guardado no aparelho, junto do resto do perfil.
   ============================================================ */

const ENFEITES_CHAVE = "poneis.enfeites.v1";

/* Cada enfeite é um SVG desenhado sobre o retrato redondo da pônei.
   A caixa é 100x100 e cobre o retrato inteiro; cada desenho se coloca
   onde faz sentido — laço na orelha, coroa no alto, óculos no meio. */
const ENFEITES = [
  { id:"laco-rosa", nome:"Laço rosa", svg:
    `<g transform="translate(68,22)"><path d="M0 0 L-13 -8 L-13 8 Z" fill="#FF6FB0"/><path d="M0 0 L13 -8 L13 8 Z" fill="#FF6FB0"/><circle cx="0" cy="0" r="5" fill="#E3488F"/></g>` },

  { id:"coroa", nome:"Coroa dourada", svg:
    `<g transform="translate(50,14)"><path d="M-18 8 L-18 -6 L-9 2 L0 -10 L9 2 L18 -6 L18 8 Z" fill="#FFC93C" stroke="#E0A81E" stroke-width="1.5"/><circle cx="0" cy="-1" r="2.6" fill="#FF6FB0"/></g>` },

  { id:"chapeu-festa", nome:"Chapéu de festa", svg:
    `<g transform="translate(50,16)"><path d="M0 -14 L11 12 L-11 12 Z" fill="#5FC4E8"/><path d="M-6 4 h13 M-9 9 h18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="0" cy="-15" r="4" fill="#FFC93C"/></g>` },

  { id:"oculos", nome:"Óculos de sol", svg:
    `<g transform="translate(50,48)"><rect x="-24" y="-7" width="20" height="14" rx="6" fill="#3A2E5E" opacity=".85"/><rect x="4" y="-7" width="20" height="14" rx="6" fill="#3A2E5E" opacity=".85"/><path d="M-4 0 h8" stroke="#3A2E5E" stroke-width="3"/></g>` },

  { id:"flor", nome:"Florzinha", svg:
    `<g transform="translate(72,30)"><g fill="#FF8FC0"><circle cx="0" cy="-7" r="5"/><circle cx="7" cy="0" r="5"/><circle cx="0" cy="7" r="5"/><circle cx="-7" cy="0" r="5"/></g><circle cx="0" cy="0" r="4" fill="#FFC93C"/></g>` },

  { id:"estrela", nome:"Estrela mágica", svg:
    `<g transform="translate(74,20)"><path d="M0-11 3.4-3.4 11-3.4 4.8 2 7.2 10 0 5.4-7.2 10-4.8 2-11-3.4-3.4-3.4Z" fill="#FFE066" stroke="#E0A81E" stroke-width="1.2"/></g>` },

  { id:"tiara", nome:"Tiara de brilhantes", svg:
    `<g transform="translate(50,18)"><path d="M-20 6 Q0 -10 20 6" fill="none" stroke="#B9E6F5" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="-3" r="3.4" fill="#5FC4E8"/><circle cx="-11" cy="2" r="2.4" fill="#fff"/><circle cx="11" cy="2" r="2.4" fill="#fff"/></g>` },

  { id:"cachecol", nome:"Cachecol listrado", svg:
    `<g transform="translate(50,80)"><rect x="-26" y="-6" width="52" height="12" rx="6" fill="#F0614F"/><rect x="-20" y="-6" width="7" height="12" fill="#fff" opacity=".8"/><rect x="-2" y="-6" width="7" height="12" fill="#fff" opacity=".8"/><rect x="15" y="-6" width="7" height="12" fill="#fff" opacity=".8"/></g>` },

  { id:"orelhinhas", nome:"Orelhinhas", svg:
    `<g transform="translate(50,12)"><circle cx="-17" cy="4" r="9" fill="#FF8FC0"/><circle cx="17" cy="4" r="9" fill="#FF8FC0"/><circle cx="-17" cy="4" r="4.5" fill="#fff"/><circle cx="17" cy="4" r="4.5" fill="#fff"/><path d="M-17 4 Q0 -8 17 4" fill="none" stroke="#E3488F" stroke-width="3"/></g>` },

  { id:"chapeu-bruxa", nome:"Chapéu de bruxa", svg:
    `<g transform="translate(50,16)"><ellipse cx="0" cy="12" rx="22" ry="5" fill="#6B3FBF"/><path d="M0 -16 L12 12 L-12 12 Z" fill="#8B5CE0"/><rect x="-13" y="4" width="26" height="5" rx="2" fill="#FFC93C"/></g>` },

  { id:"coroa-flores", nome:"Coroa de flores", svg:
    `<g transform="translate(50,16)"><path d="M-20 8 Q0 -6 20 8" fill="none" stroke="#7ECB8A" stroke-width="4" stroke-linecap="round"/><circle cx="-13" cy="3" r="4.5" fill="#FFC93C"/><circle cx="0" cy="-2" r="5" fill="#FF8FC0"/><circle cx="13" cy="3" r="4.5" fill="#B9E6F5"/></g>` },

  { id:"asinhas", nome:"Asinhas brilhantes", svg:
    `<g transform="translate(50,55)"><path d="M-22 0 Q-38 -16 -34 6 Q-30 16 -18 8 Z" fill="#B9E6F5" opacity=".9" stroke="#5FC4E8" stroke-width="1.5"/><path d="M22 0 Q38 -16 34 6 Q30 16 18 8 Z" fill="#B9E6F5" opacity=".9" stroke="#5FC4E8" stroke-width="1.5"/></g>` }
];

/* ---------- guardar e ler ---------- */
function enfeitesGanhos(){
  try{
    const b = JSON.parse(localStorage.getItem(ENFEITES_CHAVE) || "null");
    if(!b || !Array.isArray(b.tem)) return { tem: [], usando: null };
    return { tem: b.tem.filter(id => ENFEITES.some(e => e.id === id)), usando: b.usando || null };
  }catch(e){ return { tem: [], usando: null }; }
}

function guardaEnfeites(d){
  try{ localStorage.setItem(ENFEITES_CHAVE, JSON.stringify(d)); return true; }
  catch(e){ return false; }
}

function enfeiteEmUso(){
  const d = enfeitesGanhos();
  return ENFEITES.find(e => e.id === d.usando) || null;
}

function totalEnfeites(){ return ENFEITES.length; }
function quantosEnfeites(){ return enfeitesGanhos().tem.length; }

/* Ganha um enfeite novo. Devolve o enfeite, ou null quando já tem todos.
   O ganho entra em uso na hora: o prêmio tem de ser visível já. */
function ganhaEnfeite(){
  const d = enfeitesGanhos();
  const faltam = ENFEITES.filter(e => !d.tem.includes(e.id));
  if(!faltam.length) return null;
  const novo = faltam[Math.floor(Math.random() * faltam.length)];
  d.tem.push(novo.id);
  d.usando = novo.id;
  guardaEnfeites(d);
  return novo;
}

function usaEnfeite(id){
  const d = enfeitesGanhos();
  if(!d.tem.includes(id)) return false;
  d.usando = id;
  guardaEnfeites(d);
  return true;
}

/* ---------- desenhar sobre um retrato ----------
   Recebe o elemento que contém a foto da pônei e sobrepõe o enfeite.
   O elemento precisa ser position:relative ou absolute. */
function poeEnfeite(caixa, enfeite){
  if(!caixa) return;
  const antigo = caixa.querySelector(".enfeite");
  if(antigo) antigo.remove();

  const e = enfeite || enfeiteEmUso();
  if(!e) return;

  const d = document.createElement("div");
  d.className = "enfeite";
  d.style.cssText = "position:absolute; inset:0; pointer-events:none; z-index:3";
  d.innerHTML = '<svg viewBox="0 0 100 100" style="width:100%;height:100%;overflow:visible">' + e.svg + '</svg>';
  if(getComputedStyle(caixa).position === "static") caixa.style.position = "relative";
  caixa.appendChild(d);
}
