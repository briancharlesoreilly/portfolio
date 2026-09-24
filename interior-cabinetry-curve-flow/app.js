const $=id=>document.getElementById(id);
let current=0;
const gallery=$('gallery'),note=$('note');
function render(){
 const s=slides[current];
 $('error').hidden=true;$('photo').src=s.src;$('photo').alt=s.alt;
 $('title').textContent=s.title;$('chapter').textContent=({Flow:'01',Character:'02',Relief:'03'}[s.chapter])+' / '+s.chapter;
 $('counter').textContent=String(current+1).padStart(2,'0')+' / '+slides.length;
 $('progress').style.width=((current+1)/slides.length*100)+'%';
 $('prev').disabled=current===0;$('next').disabled=current===slides.length-1;
 document.querySelectorAll('#grid button').forEach((b,i)=>{b.classList.toggle('selected',i===current);b.setAttribute('aria-current',i===current?'true':'false')});
 if(current+1<slides.length){const img=new Image();img.src=slides[current+1].src}
}
function go(i){current=Math.max(0,Math.min(slides.length-1,i));history.replaceState(null,'','#'+(current+1));render()}
function readHash(){const n=Number(location.hash.slice(1));current=Number.isInteger(n)&&n>=1&&n<=slides.length?n-1:0;render()}
$('prev').onclick=()=>go(current-1);$('next').onclick=()=>go(current+1);
$('photo').onerror=()=>{$('error').hidden=false};
$('overview').onclick=()=>gallery.showModal();
$('notes').onclick=()=>{const s=slides[current];$('note-title').textContent=s.title;$('note-text').textContent=s.note;$('trend-source').hidden=current!==5;note.showModal()};
for(const d of [gallery,note]){d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})}
slides.forEach((s,i)=>{const b=document.createElement('button');b.setAttribute('aria-label','Show image '+(i+1)+': '+s.title);const img=document.createElement('img');img.src=s.src;img.alt='';img.loading='lazy';const label=document.createElement('span');label.textContent=String(i+1).padStart(2,'0')+' / '+s.title;b.append(img,label);b.onclick=()=>{go(i);gallery.close()};$('grid').append(b)});
document.addEventListener('keydown',e=>{if(gallery.open||note.open)return;if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();go(e.key==='Home'?0:e.key==='End'?slides.length-1:current+(e.key==='ArrowRight'?1:-1))}});
let touch=null;
$('stage').addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});
$('stage').addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)go(current+(dx<0?1:-1));touch=null},{passive:true});
window.addEventListener('hashchange',readHash);readHash();
