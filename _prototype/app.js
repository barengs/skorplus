/* ====================================================
   SkorPluss — app.js
   Interactivity for all pages
   ==================================================== */

// ---- NAVBAR SCROLL ----
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.boxShadow = window.scrollY > 10 ? '0 4px 24px rgba(0,0,0,0.1)' : '0 2px 12px rgba(0,0,0,0.05)';
});

function toggleMenu() {
  document.getElementById('mobile-menu')?.classList.toggle('open');
}

// ---- TOPBAR COUNTDOWN ----
(function initCountdown() {
  const h = document.getElementById('ct-h');
  const m = document.getElementById('ct-m');
  const s = document.getElementById('ct-s');
  if (!h) return;
  let total = parseInt(h.textContent) * 3600 + parseInt(m.textContent) * 60 + parseInt(s.textContent);
  setInterval(() => {
    if (total <= 0) return;
    total--;
    h.textContent = String(Math.floor(total / 3600)).padStart(2, '0');
    m.textContent = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    s.textContent = String(total % 60).padStart(2, '0');
  }, 1000);
})();

// ---- CBT TIMER ----
(function initCBTTimer() {
  const el = document.getElementById('cbt-timer');
  if (!el) return;
  let [hh, mm, ss] = el.textContent.split(':').map(Number);
  let total = hh * 3600 + mm * 60 + ss;
  const iv = setInterval(() => {
    if (total <= 0) { clearInterval(iv); el.textContent = '00:00:00'; el.style.color = '#dc2626'; return; }
    total--;
    const h2 = Math.floor(total / 3600);
    const m2 = Math.floor((total % 3600) / 60);
    const s2 = total % 60;
    el.textContent = `${String(h2).padStart(2,'0')}:${String(m2).padStart(2,'0')}:${String(s2).padStart(2,'0')}`;
    if (total < 600) el.style.animation = 'pulse 1s infinite';
  }, 1000);
})();

// ---- CBT ANSWER SELECT ----
function selectAnswer(el, letter) {
  document.querySelectorAll('.answer-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  // Update soal navigator to answered
  const current = document.querySelector('.soal-num.current');
  if (current) { current.classList.remove('current'); current.classList.add('answered'); }
  console.log('Selected answer:', letter);
}

// ---- CBT NAVIGATION ----
let currentSoal = 14;
function nextSoal() {
  if (currentSoal < 20) { currentSoal++; updateSoalNav(); }
  else alert('Ini soal terakhir pada subtes ini. Silakan pindah ke subtes berikutnya.');
}
function prevSoal() {
  if (currentSoal > 1) { currentSoal--; updateSoalNav(); }
}
function updateSoalNav() {
  document.querySelectorAll('.soal-num').forEach((el, i) => {
    el.classList.remove('current');
    if (i + 1 === currentSoal) el.classList.add('current');
  });
}

// ---- RAGU-RAGU ----
let isRagu = false;
function toggleRagu() {
  isRagu = !isRagu;
  const btn = document.getElementById('btn-ragu');
  const icon = document.getElementById('ragu-icon');
  if (btn && icon) {
    icon.textContent = isRagu ? '☑' : '☐';
    btn.style.background = isRagu ? 'var(--orange-100)' : '';
  }
  const current = document.querySelector('.soal-num.current');
  if (current) {
    current.classList.toggle('doubt', isRagu);
    if (isRagu) current.classList.remove('answered');
  }
}

// ---- CBT SUBTAB ----
function switchSubtab(el, tab) {
  document.querySelectorAll('.subtab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// ---- FORM STEPS (Daftar) ----
let currentStep = 1;
function goStep(n) {
  // Hide current
  const cur = document.getElementById(`form-step-${currentStep}`);
  if (cur) cur.style.display = 'none';
  // Show target
  const target = document.getElementById(`form-step-${n}`);
  if (target) target.style.display = 'block';
  // Update step circles
  for (let i = 1; i <= 4; i++) {
    const c = document.getElementById(`step-c-${i}`);
    const line = document.getElementById(`line-${i}`);
    if (!c) continue;
    c.classList.remove('active', 'done');
    if (i < n) { c.classList.add('done'); c.textContent = '✓'; if (line) line.classList.add('done'); }
    else if (i === n) { c.classList.add('active'); c.textContent = i; if (line) line.classList.remove('done'); }
    else { c.textContent = i; if (line) line.classList.remove('done'); }
  }
  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- PROGRAM SELECT (Daftar) ----
function selectProg(prog) {
  document.querySelectorAll('.prog-option').forEach(o => o.classList.remove('selected'));
  const el = document.getElementById(`opt-${prog}`);
  if (el) el.classList.add('selected');
  // Update check circles
  document.querySelectorAll('.check-circle').forEach(c => { c.textContent = ''; c.style.background = ''; c.style.border = '2px solid var(--gray-300)'; });
  const check = document.getElementById(`check-${prog}`);
  if (check) { check.textContent = '✓'; check.style.background = 'var(--blue-500)'; check.style.border = '2px solid var(--blue-500)'; check.style.color = 'white'; }
}

// ---- PROMO CODE ----
function applyPromo() {
  const code = document.getElementById('promo-code')?.value.toUpperCase();
  const msg = document.getElementById('promo-msg');
  if (!msg) return;
  if (code === 'PRESTASI2025') {
    msg.textContent = '✅ Potongan Rp 500.000 berhasil diterapkan!';
    msg.style.color = 'var(--green-500)';
  } else if (code && code.length > 3) {
    msg.textContent = '❌ Kode promo tidak valid atau sudah kedaluwarsa.';
    msg.style.color = '#dc2626';
  } else {
    msg.textContent = 'Masukkan kode promo terlebih dahulu.';
    msg.style.color = 'var(--gray-400)';
  }
}

// ---- FORUM ----
function toggleAskModal() {
  const m = document.getElementById('ask-modal');
  if (!m) return;
  const open = m.style.display !== 'none';
  m.style.display = open ? 'none' : 'block';
  if (!open) m.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function submitQuestion() {
  const desc = document.getElementById('ask-desc')?.value;
  if (!desc || desc.trim().length < 10) {
    alert('Deskripsikan pertanyaan Anda minimal 10 karakter.');
    return;
  }
  toggleAskModal();
  // Inject new post at top
  const posts = document.getElementById('forum-posts');
  if (!posts) return;
  const newPost = document.createElement('div');
  newPost.className = 'forum-post';
  newPost.style.borderLeft = '3px solid var(--blue-500)';
  newPost.style.animation = 'slideIn 0.4s ease';
  newPost.innerHTML = `
    <div class="post-author">
      <div class="post-av">👨‍🎓</div>
      <div class="post-meta">
        <strong>Fathur Rahman <span class="post-school">SMAN 8 Jakarta</span></strong>
        <small>Baru saja • Menunggu jawaban tutor</small>
      </div>
    </div>
    <div class="post-title">${desc.substring(0, 100)}${desc.length > 100 ? '...' : ''}</div>
    <div style="background:var(--orange-100);border-radius:8px;padding:8px 14px;font-size:13px;color:#92400e;font-weight:600;display:inline-block;margin-bottom:10px">
      ⏳ Sedang dimasukkan ke antrean tutor...
    </div>
    <div class="post-actions">
      <button class="action-btn">👍 0</button>
      <button class="action-btn">💬 Balas</button>
    </div>
  `;
  posts.insertBefore(newPost, posts.firstChild);
}

function filterTopic(el, topic) {
  document.querySelectorAll('.topic-tag').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const posts = document.querySelectorAll('.forum-post');
  posts.forEach(p => {
    if (topic === 'semua' || topic === 'ter') { p.style.display = ''; return; }
    p.style.display = p.dataset.topic === topic ? '' : 'none';
  });
}

function filterPosts(q) {
  const posts = document.querySelectorAll('.forum-post');
  const lq = q.toLowerCase();
  posts.forEach(p => {
    const text = p.textContent.toLowerCase();
    p.style.display = text.includes(lq) ? '' : 'none';
  });
}

function toggleFaq(el) {
  const q = el.querySelector('.faq-q');
  const arrow = q.querySelector('span:last-child');
  const existing = el.querySelector('.faq-a');
  if (existing) { existing.remove(); if (arrow) arrow.textContent = '›'; return; }
  if (arrow) arrow.textContent = '‌∨';
  const ans = document.createElement('div');
  ans.className = 'faq-a';
  ans.style.cssText = 'padding:8px 12px;font-size:12px;color:var(--gray-600);line-height:1.6;background:var(--gray-50);border-top:1px solid var(--gray-100)';
  const qText = q.querySelector('span:first-child')?.textContent || '';
  const answers = {
    'Berapa lama rata-rata tutor menjawab soal?': 'Rata-rata 14 menit. Di jam sibuk (16:00-22:00) bisa mencapai 25 menit. Prioritas diberikan ke pengguna Paket Intensif & Garansi.',
    'Apakah bisa request sesi live 1-on-1?': 'Ya! Pengguna Paket Garansi mendapat 4x sesi 1-on-1 per bulan. Bisa dijadwalkan via menu Jadwal Privat di dashboard.',
    'Jadwal bimbingan live streaming minggu ini?': 'Senin-Jumat 19:00-21:00 WIB (Matematika & Fisika). Sabtu 09:00-11:00 (TPS). Minggu 14:00-16:00 (Biologi & Kimia).',
    'Berapa kuota pertanyaan yang saya miliki?': 'Paket Mandiri: 10 pertanyaan/bulan. Paket Intensif: Unlimited. Paket Garansi: Unlimited + prioritas jawaban.',
  };
  ans.textContent = answers[qText] || 'Hubungi CS kami di 0812-3456-7890 untuk info lebih lanjut.';
  el.appendChild(ans);
}

// ---- PROGRAM CAROUSEL ----
function scrollProg(dir) {
  const carousel = document.querySelector('.program-cards');
  if (carousel) carousel.scrollBy({ left: dir * 300, behavior: 'smooth' });
}

// ---- SMOOTH ACTIVE NAV ----
(function highlightNavOnScroll() {
  const sections = document.querySelectorAll('section[id]');
  if (!sections.length) return;
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 80) current = s.id; });
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--blue-500)' : '';
      a.style.background = a.getAttribute('href') === `#${current}` ? 'var(--blue-100)' : '';
    });
  });
})();

// ---- CSS ANIMATION INJECTION ----
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
.app-layout { animation: fadeIn 0.35s ease; }
`;
document.head.appendChild(style);
