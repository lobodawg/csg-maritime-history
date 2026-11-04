(function(){
"use strict";
var CAT={D:"Drill",M:"Mission",V:"Vessel acquisition",X:"Maintenance",A:"Admin"};
var UNIT={N:"North Harbor Det",O:"MCC ONE",H:"Other / HQ"};
var SRC={D:"MCC ONE records",G:"Email records",A:"Photo archive courtesy of Bob Reynolds"};
var MON=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
var T=window.TIMELINE||[], P=window.PHOTOS||[], EG=window.ENTRY_GAL||{}, PE=window.PHOTO_ENTRY||{};
var VIDS=window.VIDEOS||[],IDX2V={};VIDS.forEach(function(v){if(v.ti!=null)(IDX2V[v.ti]=IDX2V[v.ti]||[]).push(v);});
function ytUrl(id){return "https://www.youtube.com/watch?v="+id;}
var IDX2G={};Object.keys(EG).forEach(function(k){EG[k].i.forEach(function(i){IDX2G[i]=k;});});
function thumbOf(f){return f.indexOf("x/")===0?"assets/img/x/thumb/"+f.slice(2):"assets/img/thumb/"+f;}
function $(id){return document.getElementById(id);}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function fmt(d){var p=d.split("-");if(p.length===3)return p[2]+" "+MON[+p[1]-1]+" "+p[0];if(p.length===2)return MON[+p[1]-1]+" "+p[0];return d;}

/* nav */
var tog=document.querySelector(".nav-toggle"),links=$("navlinks");
tog.addEventListener("click",function(){var o=links.classList.toggle("open");tog.setAttribute("aria-expanded",o);});
links.addEventListener("click",function(e){if(e.target.tagName==="A"){links.classList.remove("open");tog.setAttribute("aria-expanded",false);}});
var bar=$("topbar");function onScroll(){bar.classList.toggle("solid",window.scrollY>40);}
window.addEventListener("scroll",onScroll,{passive:true});onScroll();

/* stats */
var yrs=T.filter(function(r){return r.d<"2025";});
var stats=[[yrs.filter(function(r){return r.c==="M";}).length,"missions"],[yrs.filter(function(r){return r.c==="D";}).length,"drills and training days"],["5","vessels"],["1891","first state Naval Battalion"]];
stats.forEach(function(s){var d=el("div","stat");d.appendChild(el("b",null,String(s[0])));d.appendChild(el("span",null,s[1]));$("stats").appendChild(d);});

/* heritage */
var M=window.MUSEUM, hl=$("heritage-list");
function arch(k){var w=el("span","arch"," (");var a=el("a",null,"archived copy");a.href="sources/militarymuseum/"+k+".html";a.title="Local archived copy of this militarymuseum.org page, retrieved 03 NOV 2026";w.appendChild(a);w.appendChild(document.createTextNode(")"));return w;}
(window.HERITAGE||[]).forEach(function(h){
  var li=el("li",h.modern?"modern":null);li.appendChild(el("span","hy",h.y));
  var c=el("div","hc");c.appendChild(el("h3",null,h.h));c.appendChild(el("p",null,h.b));
  var s=el("p","cite");s.appendChild(document.createTextNode("Source: "));
  h.s.forEach(function(k,i){if(i)s.appendChild(document.createTextNode("; "));var a=el("a",null,M[k].t);a.href=M[k].u;a.rel="noopener";a.target="_blank";s.appendChild(a);s.appendChild(arch(k));});
  if(h.modern){s.appendChild(document.createTextNode("; CSG Maritime Timeline"));}
  c.appendChild(s);li.appendChild(c);hl.appendChild(li);
});
var hs=$("heritage-sources");Object.keys(M).forEach(function(k){var li=el("li");var a=el("a",null,M[k].t);a.href=M[k].u;a.rel="noopener";a.target="_blank";li.appendChild(a);li.appendChild(arch(k));li.appendChild(el("span","url"," "+M[k].u));hs.appendChild(li);});

/* timeline */
$("tl-total").textContent=T.length;
var state={year:"",cats:{},unit:"",vessel:"",q:"",photo:false,limit:40};
var YEARS=["2016","2017","2018","2019","2020","2021","2022","2023","2024","2026"];
var yb=$("yearbar");
function yearBtn(y,label){var b=el("button","ychip",label);b.type="button";b.setAttribute("role","tab");b.dataset.y=y;
  var n=y?T.filter(function(r){return r.d.slice(0,4)===y;}).length:T.length;b.appendChild(el("small",null,String(n)));
  b.addEventListener("click",function(){state.year=y;state.limit=40;render();});yb.appendChild(b);}
yearBtn("","All");YEARS.forEach(function(y){yearBtn(y,y==="2026"?"2026 (later notes)":y);});
var cc=$("catchips");Object.keys(CAT).forEach(function(k){var l=el("label","chip c"+k);var i=el("input");i.type="checkbox";i.value=k;
  i.addEventListener("change",function(){if(i.checked)state.cats[k]=1;else delete state.cats[k];state.limit=40;render();});l.appendChild(i);l.appendChild(el("span",null,CAT[k]));cc.appendChild(l);});
$("f-unit").addEventListener("change",function(e){state.unit=e.target.value;state.limit=40;render();});
$("f-vessel").addEventListener("change",function(e){state.vessel=e.target.value;state.limit=40;render();});
var qt;$("f-q").addEventListener("input",function(e){clearTimeout(qt);qt=setTimeout(function(){state.q=e.target.value.trim().toLowerCase();state.limit=40;render();},120);});
$("f-photo").addEventListener("change",function(e){state.photo=e.target.checked;state.limit=40;render();});
$("f-reset").addEventListener("click",function(){state={year:"",cats:{},unit:"",vessel:"",q:"",photo:false,limit:40};$("filters").reset();render();});
$("tl-more").addEventListener("click",function(){state.limit+=60;render();});
function match(r){
  if(state.year&&r.d.slice(0,4)!==state.year)return false;
  if(Object.keys(state.cats).length&&!state.cats[r.c])return false;
  if(state.unit&&r.u!==state.unit)return false;
  if(state.vessel==="none"&&r.v)return false;
  if(state.vessel&&state.vessel!=="none"&&r.v.indexOf(state.vessel)<0)return false;
  if(state.photo&&!r.ph)return false;
  if(state.q){var h=(r.d+" "+r.e+" "+r.l+" "+r.v+" "+r.p+" "+CAT[r.c]+" "+UNIT[r.u]+" "+r.s.join(" ")).toLowerCase();
    var ws=state.q.split(/\s+/);for(var i=0;i<ws.length;i++)if(h.indexOf(ws[i])<0)return false;}
  return true;}
function render(){
  Array.prototype.forEach.call(yb.children,function(b){var on=b.dataset.y===state.year;b.classList.toggle("on",on);b.setAttribute("aria-selected",on);});
  var H=$("highlights");H.innerHTML="";
  if(state.year&&window.HIGHLIGHTS[state.year]){H.appendChild(el("h3",null,state.year+" highlights"));var ul=el("ul");window.HIGHLIGHTS[state.year].forEach(function(t){ul.appendChild(el("li",null,t));});H.appendChild(ul);H.hidden=false;}
  else if(state.year==="2026"){H.appendChild(el("h3",null,"After 2024"));H.appendChild(el("p",null,"Two later records are kept because they show where the boats went: a 12 JAN 2026 branch order deactivating the CSG Maritime Support Group, and 2026 photos of the 47 MLB by Bob Reynolds."));H.hidden=false;}
  else H.hidden=true;
  var rows=T.filter(match);
  $("tl-count").textContent=rows.length+" of "+T.length+" entries";
  var E=$("entries");E.innerHTML="";var last="";
  rows.slice(0,state.limit).forEach(function(r){
    var y=r.d.slice(0,4);if(y!==last){E.appendChild(el("li","ysep",y));last=y;}
    var li=el("li","entry c"+r.c);
    var top=el("div","etop");top.appendChild(el("time",null,fmt(r.d)));top.appendChild(el("span","tag c"+r.c,CAT[r.c]));top.appendChild(el("span","tag unit",UNIT[r.u]));
    if(r.v)top.appendChild(el("span","tag ves",r.v));if(r.ph){var c=el("span","cam","\uD83D\uDCF7");c.title="Photos or video in the source collections";c.setAttribute("aria-label","has photos");top.appendChild(c);}
    li.appendChild(top);
    var gk=IDX2G[T.indexOf(r)];
    if(gk){var g=EG[gk],tb=el("button","ethumb");tb.type="button";var n=g.p.length;
      tb.setAttribute("aria-label","Open "+(n>1?n+" photos":"photo")+" for this entry");
      var ti=el("img");ti.src=thumbOf(g.p[0].f);ti.alt=g.p[0].t;ti.loading="lazy";tb.appendChild(ti);
      if(n>1)tb.appendChild(el("span","ecount",n+" photos"));
      tb.addEventListener("click",function(){openGal(gk,0);});li.appendChild(tb);li.classList.add("hasimg");}
    li.appendChild(el("p","ev",r.e));
    var meta=[];if(r.l)meta.push("Where: "+r.l);if(r.p)meta.push("People: "+r.p);
    if(meta.length)li.appendChild(el("p","meta",meta.join("  \u00B7  ")));
    if(r.s.length)li.appendChild(el("p","srcl","Source: "+r.s.join("; ")));
    var vv=IDX2V[T.indexOf(r)];if(vv)vv.forEach(function(v){var p=el("p","ewatch"),a=el("a",null,"\u25B6 Watch on YouTube: "+v.t);a.href=ytUrl(v.id);a.target="_blank";a.rel="noopener";p.appendChild(a);li.appendChild(p);});
    E.appendChild(li);});
  $("tl-more").hidden=rows.length<=state.limit;
}
render();

/* missions */
var MC=$("mission-cards");
(window.MISSIONS||[]).forEach(function(m){
  var a=el("article","card");var im=el("img");im.src="assets/img/thumb/"+m.img;im.alt=m.h;im.loading="lazy";im.dataset.full="assets/img/"+m.img;a.appendChild(im);
  var b=el("div","cbody");b.appendChild(el("p","cdate",m.d));b.appendChild(el("h3",null,m.h));b.appendChild(el("p",null,m.b));
  var l=el("a","clink","See entries in the timeline \u2192");l.href="#timeline";l.addEventListener("click",function(){state={year:"",cats:{},unit:"",vessel:"",q:m.q.toLowerCase(),photo:false,limit:40};$("filters").reset();$("f-q").value=m.q;render();});
  b.appendChild(l);a.appendChild(b);MC.appendChild(a);});

/* gallery + lightbox */
var G=$("grid"),GF=$("gfilters"),groups=["All"];P.forEach(function(p){if(groups.indexOf(p.g)<0)groups.push(p.g);});
var cur=[],gcur=[],idx=0;
function gal(g){G.innerHTML="";gcur=cur=P.filter(function(p){return g==="All"||p.g===g;});
  Array.prototype.forEach.call(GF.children,function(b){b.classList.toggle("on",b.textContent===g);b.setAttribute("aria-pressed",b.textContent===g);});
  cur.forEach(function(p,i){var li=el("li");var b=el("button","gbtn");b.type="button";b.setAttribute("aria-label","Open photo: "+p.t);
    var im=el("img");im.src="assets/img/thumb/"+p.f;im.alt=p.t;im.loading="lazy";b.appendChild(im);
    var cap=el("span","gcap",p.t+(p.s==="A"?" \u00B7 Bob Reynolds archive":""));b.appendChild(cap);b.addEventListener("click",function(){if(PE[p.f])openGalFor(p.f);else{cur=gcur;openLb(i);}});if(PE[p.f]&&EG[PE[p.f]].p.length>1)b.appendChild(el("span","gcount",EG[PE[p.f]].p.length));li.appendChild(b);G.appendChild(li);});}
groups.forEach(function(g){var b=el("button","gchip",g);b.type="button";b.addEventListener("click",function(){gal(g);});GF.appendChild(b);});
gal("All");
var LB=$("lightbox"),LI=$("lb-img"),LC=$("lb-cap"),lastFocus=null;
function show(){var p=cur[idx];LI.src="assets/img/"+p.f;LI.alt=p.t;LC.textContent="";LC.appendChild(el("span",null,p.t));
  var cr=(p.d?fmt(p.d)+" \u00B7 ":"")+SRC[p.s];LC.appendChild(el("small",null,cr));
  var multi=cur.length>1;$("lb-count").textContent=multi?(idx+1)+" of "+cur.length:"";$("lb-count").hidden=!multi;
  $("lb-prev").hidden=$("lb-next").hidden=!multi;
  if(multi){var nx=new Image();nx.src="assets/img/"+cur[(idx+1)%cur.length].f;}}
function openGal(k,i){cur=EG[k].p;openLb(i||0);}
function openGalFor(f){var k=PE[f];if(!k)return false;var L=EG[k].p,i=0;L.forEach(function(q,j){if(q.f===f)i=j;});openGal(k,i);return true;}
function openLb(i){lastFocus=document.activeElement;idx=i;show();LB.hidden=false;document.body.classList.add("noscroll");$("lb-close").focus();}
function closeLb(){LB.hidden=true;document.body.classList.remove("noscroll");if(lastFocus)lastFocus.focus();}
function step(n){idx=(idx+n+cur.length)%cur.length;show();}
$("lb-close").addEventListener("click",closeLb);$("lb-prev").addEventListener("click",function(){step(-1);});$("lb-next").addEventListener("click",function(){step(1);});
LB.addEventListener("click",function(e){if(e.target===LB)closeLb();});
var tx=null,ty=null;LB.addEventListener("touchstart",function(e){if(e.touches.length===1){tx=e.touches[0].clientX;ty=e.touches[0].clientY;}},{passive:true});
LB.addEventListener("touchend",function(e){if(tx===null||cur.length<2)return;var dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;tx=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.2)step(dx<0?1:-1);},{passive:true});
document.addEventListener("keydown",function(e){if(LB.hidden)return;if(e.key==="Escape")closeLb();else if(e.key==="ArrowLeft"&&cur.length>1)step(-1);else if(e.key==="ArrowRight"&&cur.length>1)step(1);});
/* fleet/mission images open their entry gallery (or a single image) */
document.addEventListener("click",function(e){var t=e.target;if(t.tagName==="IMG"&&t.dataset.full&&!t.closest(".gbtn")&&!t.closest(".ethumb")){var f=t.dataset.full.replace("assets/img/","");
  if(openGalFor(f))return;var m=P.filter(function(p){return p.f===f;})[0];cur=[m||{f:f,t:t.alt,d:"",s:"D"}];openLb(0);}});
/* videos */
(function(){var VG=$("vgroups");if(!VG||!VIDS.length)return;
  var GR=[["m","CSG Maritime 2016\u20132024"],["h","Heritage"]];
  var used=GR.filter(function(g){return VIDS.some(function(v){return v.g===g[0];});});
  used.forEach(function(g){var list=VIDS.filter(function(v){return v.g===g[0];});
    if(used.length>1)VG.appendChild(el("h3","vgh",g[1]));
    var ul=el("ul","vgrid");
    list.forEach(function(v){var li=el("li","vcard"),a=el("a","vlink");a.href=ytUrl(v.id);a.target="_blank";a.rel="noopener";
      a.setAttribute("aria-label",v.t+" ("+v.c+"), opens YouTube in a new tab");
      var f=el("span","vthumb"),im=el("img");im.src="assets/img/yt/"+v.id+".jpg";im.alt="";im.loading="lazy";f.appendChild(im);f.appendChild(el("span","vplay","\u25B6"));a.appendChild(f);
      var b=el("span","vbody");b.appendChild(el("span","vtitle",v.t));b.appendChild(el("span","vmeta",v.c+(v.y?" \u00B7 "+v.y:"")));b.appendChild(el("span","vnote",v.n));a.appendChild(b);
      li.appendChild(a);ul.appendChild(li);});
    VG.appendChild(ul);});
})();
})();
