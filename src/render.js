import { marked } from "marked";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

function isoWeek(d){const date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=date.getUTCDay()||7;date.setUTCDate(date.getUTCDate()+4-day);const ys=new Date(Date.UTC(date.getUTCFullYear(),0,1));return Math.ceil((((date-ys)/86400000)+1)/7);}
function frDate(date){try{return new Date(date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});}catch{return date;}}

function buildSections(md){
  const tokens = marked.lexer(md);
  const sections=[]; let sec=null, art=null;
  const pushArt=()=>{ if(sec&&art){ sec.articles.push(art); art=null; } };
  const pushSec=()=>{ if(sec){ pushArt(); sections.push(sec); sec=null; } };
  for(const t of tokens){
    if(t.type==="heading"&&t.depth===2){ pushSec(); sec={title:marked.parseInline(t.text),note:"",articles:[]}; }
    else if(t.type==="heading"&&t.depth===3){ if(!sec)sec={title:"",note:"",articles:[]}; pushArt(); art={headline:marked.parseInline(t.text),major:/🔥/.test(t.text),body:""}; }
    else if(t.type==="space"){}
    else{ const html=(t.type==="paragraph")?`<p>${marked.parseInline(t.text)}</p>`:marked.parser([t]); if(art)art.body+=html; else if(sec)sec.note+=html; }
  }
  pushSec();
  return sections;
}

function bodyHtmlFrom(sections){
  let html="", first=true;
  for(const sec of sections){
    html+=`<div class="band"><span>${sec.title}</span></div>`;
    if(sec.note) html+=`<div class="note">${sec.note}</div>`;
    let rest=sec.articles;
    if(first && sec.articles.length){
      const L=sec.articles[0];
      html+=`<article class="lead${L.major?" major":""}"><h2>${L.headline}</h2><div class="lead-body">${L.body}</div></article>`;
      rest=sec.articles.slice(1);
    }
    if(rest.length){
      html+=`<div class="cols">`+rest.map(a=>`<article class="art${a.major?" major":""}"><h3>${a.headline}</h3>${a.body}</article>`).join("")+`</div>`;
    }
    first=false;
  }
  return html;
}

function template(date, sections){
  const longDate=frDate(date), week=isoWeek(new Date(date+"T12:00:00"));
  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>L'Actu IA — ${longDate}</title>
<style>
  :root{--paper:#f3efe4;--ink:#14110b;--soft:#534b3d;--rule:#c7bda7;--accent:#8a2a1d;--serif:Georgia,"Iowan Old Style","Times New Roman",serif}
  *{box-sizing:border-box} html{-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--serif);line-height:1.5}
  .sheet{max-width:860px;margin:0 auto;padding:30px 26px 90px}
  .mast{text-align:center;border-bottom:4px double var(--ink);padding-bottom:12px}
  .mast .eyebrow{font-size:10.5px;letter-spacing:.4em;text-transform:uppercase;color:var(--accent);font-weight:700}
  .mast h1{font-size:clamp(46px,13vw,92px);line-height:.9;margin:.08em 0 .04em;letter-spacing:-.02em;font-weight:700}
  .mast .tag{font-style:italic;color:var(--soft);font-size:15px}
  .folio{display:flex;justify-content:space-between;gap:12px;margin-top:12px;padding:6px 0;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--soft)}
  .folio span:nth-child(2){flex:1;text-align:center}
  .band{display:flex;align-items:center;gap:14px;margin:46px 0 14px}
  .band::before,.band::after{content:"";flex:1;border-top:2px solid var(--ink)}
  .band span{font-size:13px;letter-spacing:.28em;text-transform:uppercase;font-weight:700;white-space:nowrap}
  .note{font-style:italic;color:var(--soft);margin:8px 0 0}
  .lead{margin:6px 0 8px}
  .lead h2{font-size:clamp(30px,5.4vw,42px);line-height:1.06;margin:.1em 0 .18em;font-weight:700;letter-spacing:-.015em}
  .lead.major h2::before{content:"À LA UNE";display:block;font-size:11px;letter-spacing:.22em;color:var(--accent);margin-bottom:8px;font-style:normal;font-family:var(--serif)}
  .lead-body p{font-size:18px;line-height:1.55;text-align:justify;hyphens:auto;-webkit-hyphens:auto;margin:0}
  .lead-body p:first-child::first-letter{float:left;font-size:3.3em;line-height:.74;padding:6px 10px 0 0;font-weight:700}
  .cols{column-count:2;column-gap:30px;column-rule:1px solid var(--rule);margin-top:6px}
  .art{break-inside:avoid;-webkit-column-break-inside:avoid;margin:0 0 18px;padding-bottom:14px;border-bottom:1px solid var(--rule)}
  .art h3{font-size:19px;line-height:1.16;margin:0 0 4px;font-weight:700;letter-spacing:-.01em}
  .art.major h3{border-top:2px solid var(--accent);padding-top:8px}
  .art p{font-size:15.5px;line-height:1.5;margin:4px 0 0;text-align:justify;hyphens:auto;-webkit-hyphens:auto;color:#241f16}
  a{color:var(--accent);text-decoration:none;border-bottom:1px solid rgba(138,42,29,.3)} a:hover{border-bottom-color:var(--accent)}
  em{font-style:italic;color:var(--soft)} strong{font-weight:700}
  .colophon{margin-top:60px;border-top:4px double var(--ink);padding-top:12px;font-size:12px;color:var(--soft);text-align:center}
  @media (max-width:600px){.cols{column-count:1}.folio{flex-direction:column;gap:3px}.art p,.lead-body p{text-align:left;hyphens:none}}
</style></head><body>
<main class="sheet">
  <header class="mast">
    <div class="eyebrow">Le journal hebdomadaire de l'intelligence artificielle</div>
    <h1>L'Actu&nbsp;IA</h1>
    <div class="tag">« Humain + IA &gt; IA seule »</div>
    <div class="folio"><span>${longDate}</span><span>Édition de la semaine</span><span>N°&nbsp;${week}</span></div>
  </header>
  ${bodyHtmlFrom(sections)}
  <div class="colophon">Curation automatique · sources : flux officiels, Google News, GitHub, Hacker News.</div>
</main></body></html>`;
}

export async function renderHtml(fullMarkdown, date){
  const sections=buildSections(fullMarkdown);
  const html=template(date, sections);
  await mkdir("docs",{recursive:true});
  await writeFile(path.join("docs",`${date}.html`),html);
  await writeFile(path.join("docs","index.html"),html);
  console.log(`[render] page HTML : docs/${date}.html (+ index.html)`);
}
