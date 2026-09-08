
const body = document.body;
const startBtn = document.getElementById('startBtn');
const progress = document.getElementById('progress');
const noteDialog = document.getElementById('noteDialog');
const noteText = document.getElementById('noteText');
const closeNote = document.querySelector('.note-dialog__close');
const oneMore = document.getElementById('oneMore');


startBtn.addEventListener('click', () => {
  const music = document.getElementById('bgMusic');
  if (music) music.play().catch(() => {});
  body.classList.add('started');
  setTimeout(() => document.getElementById('story').scrollIntoView({behavior:'smooth'}), 250);
  updateProgress();
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, {threshold: 0.13, rootMargin:'0px 0px -5% 0px'});

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

function updateProgress(){
  if(!body.classList.contains('started')) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - innerHeight;
  const pct = max > 0 ? (scrollY / max) * 100 : 0;
  progress.style.width = Math.max(0, Math.min(100, pct)) + '%';
}
addEventListener('scroll', updateProgress, {passive:true});
addEventListener('resize', updateProgress);

document.querySelectorAll('.love-note').forEach(btn => {
  btn.addEventListener('click', () => {
    noteText.textContent = btn.dataset.note;
    if(typeof noteDialog.showModal === 'function') noteDialog.showModal();
    else noteDialog.setAttribute('open','');
  });
});

closeNote.addEventListener('click', () => noteDialog.close());
noteDialog.addEventListener('click', e => {
  const r = noteDialog.getBoundingClientRect();
  if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){
    noteDialog.close();
  }
});

oneMore.addEventListener('click', () => {
  document.getElementById('ending').scrollIntoView({behavior:'smooth'});
});

document.querySelectorAll('img').forEach(img => {
  img.loading = img.closest('.cover') ? 'eager' : 'lazy';
  img.decoding = 'async';
});
