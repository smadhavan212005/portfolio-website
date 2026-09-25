import * as anime from 'animejs';
import Lenis from 'lenis';
import './style.css';
import { RATIOS } from './gallery-data.js';

const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/** anime.js API (installed from npm). Null when the visitor prefers reduced motion, so the site stays static. */
let A = reduceMotion ? null : anime;
let lenis = null;

/* =====================================================================
   Core UI (works without anime.js)
   ===================================================================== */
/* ---------- Experience timeline: dated axis, one bar per role, a pin that follows the scroll ---------- */
function buildExpTimeline() {
  const root = $('#expTimeline'), cards = $$('.tl-item');
  if (!root || !cards.length) return null;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  const nowM = d.getFullYear() * 12 + d.getMonth() + d.getDate() / 31;
  const ym = (s) => (s === 'now' ? nowM : +s.slice(0, 4) * 12 + (+s.slice(5, 7) - 1));
  const jobs = cards.map((el, i) => {
    const s = ym(el.dataset.start), e = el.dataset.end === 'now' ? nowM : ym(el.dataset.end) + 1;
    return { el, i, s, e, focus: (s + e) / 2, lane: 0, name: el.dataset.short, months: Math.max(1, Math.round(e - s)) };
  });
  // Pack the bars into as few rows as possible: each role goes into the first row where it starts after the previous bar ends.
  const rowEnds = [];
  [...jobs].sort((a, b) => a.s - b.s).forEach((j) => {
    let r = rowEnds.findIndex((end) => end + .45 <= j.s);
    if (r === -1) { r = rowEnds.length; rowEnds.push(0); }
    rowEnds[r] = j.e;
    j.lane = r;
  });
  root.style.setProperty('--lanes', rowEnds.length);
  const t0 = Math.min(...jobs.map((j) => j.s)), span = nowM - t0;
  const pos = (t) => ((t - t0) / span) * 100;
  const label = (t) => `${MON[Math.floor(t % 12)]} ${Math.floor(t / 12)}`;
  const dur = (m) => (m < 12 ? `${m} mos` : `${Math.floor(m / 12)} yr${m >= 24 ? 's' : ''}${m % 12 ? ` ${m % 12} mos` : ''}`);

  root.innerHTML = `<div class="tl__axis"><i class="tl__flow"></i></div><div class="tl__ticks"></div><div class="tl__lanes"></div>
    <div class="tl__head"><span class="tl__line"></span><i class="tl__ring"></i><b class="tl__pin"></b><span class="tl__date"></span></div>`;
  const axis = $('.tl__axis', root), flow = $('.tl__flow', root), ticks = $('.tl__ticks', root), lanes = $('.tl__lanes', root);
  const head = $('.tl__head', root), ring = $('.tl__ring', root), dateEl = $('.tl__date', root);
  jobs.forEach((j) => {
    const p = document.createElement('button');
    p.type = 'button';
    p.className = 'tl__pill';
    p.setAttribute('aria-label', `Go to ${j.name}, ${dur(j.months)}`);
    p.addEventListener('click', () => api.goTo(j.i));
    p.style.cssText = `left:${pos(j.s)}%;width:${pos(j.e) - pos(j.s)}%;--lane:${j.lane}`;
    p.title = `${j.name} · ${dur(j.months)}`;
    p.innerHTML = `<span class="tl__badge">${j.name[0]}</span><span class="tl__name">${j.name}</span><span class="tl__dur">${dur(j.months)}</span>`;
    lanes.append(p);
    j.pill = p;
  });

  let width = 1, centers = [], active = -1;
  const layout = () => {
    width = root.clientWidth;
    ticks.innerHTML = '';
    const step = width < 640 ? 12 : 6;
    for (let t = t0; t < nowM - step * 0.45; t += step) {
      const sp = document.createElement('span');
      sp.style.left = `${pos(t)}%`;
      sp.textContent = label(t);
      ticks.append(sp);
    }
    const end = document.createElement('span');
    end.className = 'is-end'; end.style.left = '100%'; end.textContent = 'Now';
    ticks.append(end);
    jobs.forEach((j) => {
      const w = ((pos(j.e) - pos(j.s)) / 100) * width;
      j.pill.classList.toggle('no-dur', w < 150);
      j.pill.classList.toggle('no-name', w < 92);
    });
    centers = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
  };

  function setActive(i) {
    active = i;
    jobs.forEach((j) => { j.pill.classList.toggle('is-active', j.i === i); j.el.classList.toggle('is-current', j.i === i); });
    if (A) {
      A.animate(jobs[i].pill, { scale: [1, 1.05, 1], duration: 600, ease: 'outBack' });
      A.animate(ring, { scale: [1, 3.2], opacity: [.8, 0], duration: 900, ease: 'outQuad' });
    }
  }

  /** p: 0..1 progress through the experience cards. Slides the pin along the axis between role midpoints. */
  function update(p) {
    const n = jobs.length;
    if (!centers.length) layout();
    const X = centers[0] + Math.min(1, Math.max(0, p)) * (centers[n - 1] - centers[0]);
    let f = 0;
    if (X >= centers[n - 1]) f = n - 1;
    else if (X > centers[0]) { let i = 0; while (i < n - 2 && X >= centers[i + 1]) i++; f = i + (X - centers[i]) / (centers[i + 1] - centers[i]); }
    const i = Math.min(n - 2, Math.floor(f)), fr = f - i;
    const t = n > 1 ? jobs[i].focus + (jobs[i + 1].focus - jobs[i].focus) * fr : jobs[0].focus;
    head.style.transform = `translateX(${(pos(t) / 100) * width}px)`;
    dateEl.textContent = label(t);
    const a = Math.round(f);
    if (a !== active) setActive(a);
  }

  layout();
  update(0);
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { layout(); }, 150); });
  document.fonts?.ready.then(layout);

  if (A) {
    const { animate, stagger, utils } = A;
    utils.set(axis, { scaleX: 0 });
    utils.set([...$$('.tl__ticks span', root), head], { opacity: 0 });
    utils.set(jobs.map((j) => j.pill), { scaleX: 0, opacity: 0 });
    const io = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      animate(axis, { scaleX: [0, 1], duration: 1200, ease: 'outExpo' });
      animate($$('.tl__ticks span', root), { opacity: [0, 1], translateY: [8, 0], duration: 700, delay: stagger(80, { start: 300 }), ease: 'outExpo' });
      animate(jobs.map((j) => j.pill), { scaleX: [0, 1], opacity: [0, 1], duration: 1100, delay: stagger(110, { start: 400 }), ease: 'outExpo' });
      animate(head, { opacity: [0, 1], duration: 600, delay: 1000, ease: 'outQuad' });
      animate(flow, { translateX: [-100, width], duration: 3400, delay: 1200, loop: true, ease: 'inOutSine' });
    }, { threshold: .2 });
    io.observe(root);
  }
  /** Jump to a role: scroll the pinned section (or swipe the row) so that role's card is on screen and the pin sits on its bar. */
  function goTo(i) {
    if (!centers.length) layout();
    if (api.track) {
      const c = cards[i], t = api.track;
      t.scrollTo({ left: c.offsetLeft - (t.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
      return;
    }
    const pin = $('#expPin'), n = jobs.length;
    const p = n > 1 ? (centers[i] - centers[0]) / (centers[n - 1] - centers[0]) : 0;
    const y = pin.getBoundingClientRect().top + scrollY + p * (pin.offsetHeight - innerHeight);
    if (lenis) lenis.scrollTo(y, { duration: 1.5 });
    else scrollTo({ top: y, behavior: 'smooth' });
  }
  const api = {
    update,
    layout,
    track: null,
    goTo,
    bindNative(track) {
      api.track = track;
      const upd = () => update(track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth));
      track.addEventListener('scroll', upd, { passive: true });
      upd();
    },
  };
  return api;
}
let expTl = null;

/* ---------- Scroll-percentage island ---------- */
const pct = $('#pct'), pctNum = $('#pctNum'), pctLiquid = $('#pctLiquid');
let lastPct = -1;
function setPct(p) {                       // p: 0..1
  const n = Math.round(p * 100);
  if (n === lastPct) return;
  lastPct = n;
  pctNum.textContent = n;
  pct.setAttribute('aria-label', `Scrolled ${n} percent. Back to top`);
  pctLiquid.setAttribute('transform', `translate(0 ${(50 - 58 * p).toFixed(2)})`);
}
pct.addEventListener('click', () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: 'smooth' })));
if (reduceMotion) {
  const upd = () => setPct(scrollY / Math.max(1, root.scrollHeight - innerHeight));
  addEventListener('scroll', upd, { passive: true });
  upd();
}

/* ---------- Dynamic-island navigation ---------- */
const isle = $('#isle');
const isleBtn = $('#isleCompact');
const navLinks = $('#navLinks');
const isleLabel = $('#isleLabel');
const isleHi = $('.isle__hi');
const backdrop = $('#isleBackdrop');
const wide = matchMedia('(min-width: 961px)');
const THEME_W = 44;                       // room reserved for the always-visible theme toggle
const NAV_TOP = 80;                       // below this scroll offset the island collapses on desktop
let isleOpen = false, hovering = false, closeTimer = 0;
let sizes = { ow: 0, oh: 0, cw: 0 };
let activeLink = null;

const measure = () => {
  sizes = { ow: navLinks.offsetWidth + (wide.matches ? THEME_W : 0), oh: navLinks.offsetHeight, cw: isleBtn.offsetWidth + THEME_W };
};
const openRadius = () => (wide.matches ? 26 : 30);

function moveHi(link, instant) {
  if (!wide.matches) return;
  if (!link) { isleHi.style.opacity = 0; return; }
  const to = { translateX: link.offsetLeft, width: link.offsetWidth, opacity: 1 };
  if (A && !instant) A.animate(isleHi, { ...to, duration: 550, ease: 'outExpo' });
  else { isleHi.style.transform = `translateX(${to.translateX}px)`; isleHi.style.width = `${to.width}px`; isleHi.style.opacity = 1; }
}

function setIsle(open, instant = false) {
  isleOpen = open;
  measure();
  isle.classList.toggle('is-open', open);
  isleBtn.setAttribute('aria-expanded', open);
  navLinks.inert = !open;
  const hideBtn = open && wide.matches;   // on phones the label stays as the panel's header row
  isleBtn.inert = hideBtn;
  const mobileOpen = open && !wide.matches;
  backdrop.classList.toggle('is-on', mobileOpen);
  document.body.classList.toggle('is-locked', mobileOpen);
  mobileOpen ? lenis?.stop() : (gallery.hidden && lenis?.start());
  const to = { width: open ? sizes.ow : sizes.cw, height: open ? sizes.oh : 44, borderRadius: open ? openRadius() : 22 };
  if (!A || instant) {
    Object.assign(isle.style, { width: `${to.width}px`, height: `${to.height}px`, borderRadius: `${to.borderRadius}px` });
    navLinks.style.opacity = open ? 1 : 0;
    isleBtn.style.opacity = hideBtn ? 0 : 1;
    if (open) moveHi(activeLink, true);
    return;
  }
  A.animate(isle, {
    width: [isle.offsetWidth, to.width], height: [isle.offsetHeight, to.height], borderRadius: to.borderRadius,
    duration: open ? 1100 : 650, ease: open ? 'outElastic(1, .72)' : 'outExpo',
  });
  A.animate(navLinks, { opacity: open ? [0, 1] : 0, scale: open ? [.9, 1] : .96, duration: open ? 500 : 180, delay: open ? 180 : 0, ease: 'outQuad' });
  A.animate(isleBtn, { opacity: hideBtn ? 0 : 1, scale: hideBtn ? .85 : 1, duration: hideBtn ? 200 : 400, delay: open ? 0 : 250, ease: 'outQuad' });
  if (open) {
    moveHi(activeLink, true);
    if (!wide.matches) A.animate($$('a', navLinks), { opacity: [0, 1], translateY: [26, 0], duration: 700, delay: A.stagger(45, { start: 150 }), ease: 'outExpo' });
  }
}

isleBtn.addEventListener('click', () => setIsle(!isleOpen));
navLinks.addEventListener('click', (e) => { if (e.target.closest('a') && !wide.matches) setIsle(false); });
backdrop.addEventListener('click', () => setIsle(false));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && isleOpen && lightbox.hidden && gallery.hidden) setIsle(false); });

// Desktop: open at the top of the page or on hover, collapse when scrolled and idle
isle.addEventListener('pointerenter', (e) => {
  if (!wide.matches || e.pointerType === 'touch') return;
  hovering = true; clearTimeout(closeTimer);
  if (!isleOpen) setIsle(true);
});
isle.addEventListener('pointerleave', () => {
  hovering = false;
  if (!wide.matches) return;
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => { if (scrollY > NAV_TOP && !hovering && isleOpen) setIsle(false); }, 500);
});
let lastY = 0;
addEventListener('scroll', () => {
  if (!wide.matches) return;
  const y = scrollY;
  if (y > NAV_TOP && lastY <= NAV_TOP && isleOpen && !hovering) setIsle(false);
  if (y <= NAV_TOP && lastY > NAV_TOP && !isleOpen) setIsle(true);
  lastY = y;
}, { passive: true });

navLinks.addEventListener('pointerover', (e) => { const a = e.target.closest('a'); if (a) moveHi(a); });
navLinks.addEventListener('pointerleave', () => moveHi(activeLink));

// Scroll-spy drives the label shown in the collapsed island
const SPY = [['hero', 'Home'], ...$$('.isle__links a').map((a) => [a.getAttribute('href').slice(1), a.textContent])];
const labels = new Map(SPY);
const linkById = new Map($$('.isle__links a').map((a) => [a.getAttribute('href').slice(1), a]));
function setLabel(text) {
  if (isleLabel.textContent === text) return;
  const apply = () => {
    isleLabel.textContent = text;
    measure();
    if (!isleOpen) {
      if (A) A.animate(isle, { width: sizes.cw, duration: 600, ease: 'outElastic(1, .8)' });
      else isle.style.width = `${sizes.cw}px`;
    }
  };
  if (!A) return apply();
  A.animate(isleLabel, { opacity: 0, translateY: -8, duration: 140, ease: 'inQuad', onComplete: () => { apply(); A.animate(isleLabel, { opacity: [0, 1], translateY: [8, 0], duration: 320, ease: 'outQuad' }); } });
}
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const id = en.target.id;
    activeLink = linkById.get(id) || null;
    linkById.forEach((a, k) => a.classList.toggle('is-active', k === id));
    setLabel(labels.get(id));
    if (isleOpen) moveHi(activeLink);
  });
}, { rootMargin: '-45% 0px -50% 0px' });
labels.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

// Initial state: drop in as a pill, then open at the top of the page (desktop)
(async () => {
  await document.fonts?.ready;
  measure();
  setIsle(false, true);
  if (A) A.animate(isle, { translateY: [-80, 0], scale: [.7, 1], duration: 1200, ease: 'outElastic(1, .7)' });
  setTimeout(() => { lastY = scrollY; if (wide.matches && scrollY <= NAV_TOP) setIsle(true); }, A ? 1000 : 0);
})();
addEventListener('resize', () => { measure(); setIsle(isleOpen && (wide.matches || isleOpen), true); });

// Theme toggle
$('#themeToggle').addEventListener('click', (e) => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (_) {}
  if (A) A.animate(e.currentTarget.firstElementChild, { rotate: [0, 180], duration: 600, ease: 'outBack' });
});

/* =====================================================================
   Photography gallery + lightbox
   ===================================================================== */
const gallery = $('#gallery');
const masonry = $('#masonry');
const galleryScroll = $('#galleryScroll');
const lightbox = $('#lightbox');
const lbImg = $('#lbImg');
const META = {
  nature: { title: 'Nature', sub: 'Wildlife, macro and landscapes' },
  portrait: { title: 'Portrait', sub: 'Light, mood and personality' },
  event: { title: 'Events', sub: 'Campus coverage and candid moments' },
};
let current = null;      // active category
let currentIdx = 0;      // lightbox index
let lastTrigger = null;
let figureObserver = null;

const thumb = (c, i) => `img/thumb/${c}${i + 1}.jpg`;
const full = (c, i) => `img/full/${c}${i + 1}.jpg`;

function buildGallery(cat) {
  masonry.innerHTML = '';
  RATIOS[cat].forEach((r, i) => {
    const fig = document.createElement('figure');
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', `Open ${META[cat].title} photo ${i + 1}`);
    fig.dataset.i = i;
    const img = new Image();
    img.src = thumb(cat, i);
    img.alt = `${META[cat].title} photograph ${i + 1}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.style.aspectRatio = `1 / ${r}`;
    fig.append(img);
    if (A) fig.style.opacity = 0;
    masonry.append(fig);
  });
  if (A) observeFigures();
}

function observeFigures() {
  figureObserver?.disconnect();
  figureObserver = new IntersectionObserver((entries) => {
    const shown = entries.filter((e) => e.isIntersecting);
    shown.forEach((e) => figureObserver.unobserve(e.target));
    if (!shown.length) return;
    A.animate(shown.map((e) => e.target), {
      opacity: [0, 1], translateY: [36, 0], scale: [.94, 1],
      duration: 800, delay: A.stagger(70), ease: 'outExpo',
    });
  }, { root: galleryScroll, threshold: .08 });
  $$('figure', masonry).forEach((f) => figureObserver.observe(f));
}

function openGallery(cat, trigger) {
  current = cat;
  lastTrigger = trigger;
  $('#galleryTitle').textContent = META[cat].title;
  $('#gallerySub').textContent = `${RATIOS[cat].length} photographs · ${META[cat].sub}`;
  buildGallery(cat);
  galleryScroll.scrollTop = 0;
  gallery.hidden = false;
  document.body.classList.add('is-locked');
  lenis?.stop();
  if (A) A.animate(gallery, { opacity: [0, 1], duration: 350, ease: 'outQuad' });
  $('#galleryClose').focus({ preventScroll: true });
}

function closeGallery() {
  if (gallery.hidden) return;
  const done = () => {
    gallery.hidden = true;
    figureObserver?.disconnect();
    document.body.classList.remove('is-locked');
    lenis?.start();
    lastTrigger?.focus({ preventScroll: true });
  };
  if (A) A.animate(gallery, { opacity: [1, 0], duration: 250, ease: 'inQuad', onComplete: done });
  else done();
}

function showPhoto(idx, dir = 0) {
  const n = RATIOS[current].length;
  currentIdx = (idx + n) % n;
  lbImg.src = full(current, currentIdx);
  lbImg.alt = `${META[current].title} photograph ${currentIdx + 1}`;
  $('#lbCount').textContent = `${currentIdx + 1} / ${n}`;
  if (A) A.animate(lbImg, { opacity: [0, 1], translateX: [dir * 50, 0], scale: [.97, 1], duration: 550, ease: 'outExpo' });
  [currentIdx + 1, currentIdx - 1].forEach((j) => { new Image().src = full(current, (j + n) % n); });
}

function openLightbox(idx) {
  lightbox.hidden = false;
  if (A) A.animate(lightbox, { opacity: [0, 1], duration: 250, ease: 'outQuad' });
  showPhoto(idx);
  $('#lbClose').focus({ preventScroll: true });
}
function closeLightbox() {
  if (lightbox.hidden) return;
  const done = () => { lightbox.hidden = true; lbImg.removeAttribute('src'); };
  if (A) A.animate(lightbox, { opacity: [1, 0], duration: 200, ease: 'inQuad', onComplete: done });
  else done();
}

$$('.cat').forEach((btn) => btn.addEventListener('click', () => openGallery(btn.dataset.gallery, btn)));
$('#galleryClose').addEventListener('click', closeGallery);
masonry.addEventListener('click', (e) => { const f = e.target.closest('figure'); if (f) openLightbox(+f.dataset.i); });
masonry.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('figure')) { e.preventDefault(); openLightbox(+e.target.dataset.i); }
});
$('#lbClose').addEventListener('click', closeLightbox);
$('#lbPrev').addEventListener('click', () => showPhoto(currentIdx - 1, -1));
$('#lbNext').addEventListener('click', () => showPhoto(currentIdx + 1, 1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
addEventListener('keydown', (e) => {
  if (!lightbox.hidden) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') showPhoto(currentIdx - 1, -1);
    else if (e.key === 'ArrowRight') showPhoto(currentIdx + 1, 1);
  } else if (!gallery.hidden && e.key === 'Escape') closeGallery();
});
let touchX = null;
lightbox.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  touchX = null;
  if (Math.abs(dx) > 50) showPhoto(currentIdx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
});

/* =====================================================================
   Animations (anime.js v4)
   Note: onScroll thresholds read "<container edge> <target edge>",
   e.g. 'end start' = viewport bottom meets the target's top.
   ===================================================================== */
async function initAnimations() {
  const { animate, createTimeline, stagger, onScroll, splitText, utils } = A;
  const mq = matchMedia('(min-width: 961px)');
  const desktop = mq.matches;
  mq.addEventListener('change', () => location.reload());

  /** Scroll-scrubbed animation: progress follows scroll position between two thresholds. */
  const scrub = (targets, params, target, enter = 'end start', leave = '60% start') =>
    animate(targets, { ease: 'linear', ...params, autoplay: onScroll({ target, enter, leave, sync: true }) });

  /* ---------- Scroll progress bar ---------- */
  const sp = { v: 0 };
  animate(sp, { v: [0, 1], ease: 'linear', onUpdate: () => setPct(sp.v), autoplay: onScroll({ target: document.body, enter: 'start start', leave: 'end end', sync: true }) });
  animate('.pct__wave--f', { translateX: [0, -46], duration: 2000, loop: true, ease: 'linear' });
  animate('.pct__wave--b', { translateX: [-46, 0], duration: 3200, loop: true, ease: 'linear' });
  animate(pct, { scale: [0, 1], duration: 1200, delay: 900, ease: 'outElastic(1, .7)' });
  pct.addEventListener('pointerenter', () => animate(pct, { scale: 1.12, duration: 300, ease: 'outQuad' }));
  pct.addEventListener('pointerleave', () => animate(pct, { scale: 1, duration: 700, ease: 'outElastic(1, .6)' }));

  /* ---------- Hero intro ---------- */
  const heroTl = createTimeline({ defaults: { ease: 'outExpo' } });
  let chars = [];
  try { chars = splitText('#heroName', { chars: true }).chars; } catch (_) {}
  if (chars.length) {
    utils.set(chars, { opacity: 0 });
    utils.set('#heroName', { opacity: 1 });
    heroTl.add(chars, { opacity: [0, 1], translateY: [60, 0], rotate: [8, 0], duration: 1100, delay: stagger(45) }, 150);
  } else {
    heroTl.add('#heroName', { opacity: [0, 1], translateY: [40, 0], duration: 1000 }, 150);
  }
  heroTl
    .add('[data-hero="fade"]', { opacity: [0, 1], translateY: [26, 0], duration: 900, delay: stagger(110) }, 350)
    .add('[data-hero="visual"]', { opacity: [0, 1], scale: [.84, 1], rotate: [-4, 0], duration: 1300 }, 300);

  utils.set('.trace', { strokeDasharray: 1, strokeDashoffset: 1 });
  animate('.trace', { strokeDashoffset: [1, 0], duration: 2800, delay: stagger(280, { start: 400 }), ease: 'inOutSine' });
  animate('.node', { opacity: [.15, 1], scale: [.6, 1.25], duration: 1400, delay: stagger(260), loop: true, alternate: true, ease: 'inOutSine' });
  animate('.chip', { translateY: [-7, 7], duration: 2800, delay: stagger(450), loop: true, alternate: true, ease: 'inOutSine' });
  animate('.portrait__ring', { rotate: 360, duration: 26000, loop: true, ease: 'linear' });

  const rot = $('#roleRotator');
  const roles = ['RTL Design & Verification', 'Embedded Systems', 'Agentic AI for VLSI', 'Photographer'];
  let ri = 0;
  setInterval(() => {
    if (document.hidden) return;
    ri = (ri + 1) % roles.length;
    animate(rot, {
      opacity: 0, translateY: -12, duration: 300, ease: 'inQuad',
      onComplete: () => {
        rot.textContent = roles[ri];
        animate(rot, { opacity: [0, 1], translateY: [12, 0], duration: 450, ease: 'outQuad' });
      },
    });
  }, 2800);

  // Hero scrolls away: content lifts and fades, the name drifts, the portrait rotates
  scrub('.hero__grid', { opacity: [1, 0], translateY: [0, -90], scale: [1, .95] }, '#hero', 'start start', 'end start');
  scrub('#heroName', { translateX: [0, -70] }, '#hero', 'start start', 'end start');
  scrub('.portrait', { translateY: [0, 90], rotate: [0, 10] }, '#hero', 'start start', 'end start');
  scrub('.hero__traces', { translateY: [0, 140] }, '#hero', 'start start', 'end start');
  if (finePointer) {
    $('#hero').addEventListener('pointermove', (e) => {
      const x = (e.clientX / innerWidth - .5) * 2;
      animate('.portrait', { translateX: x * 14, duration: 700, ease: 'outQuad' });
      animate('.hero__traces', { translateX: x * -18, duration: 900, ease: 'outQuad' });
    });
  }

  /* ---------- Section headings: masked word reveal ---------- */
  const headIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      headIO.unobserve(en.target);
      const h = en.target._head;
      if (h.words.length) animate(h.words, { translateY: ['110%', '0%'], duration: 1100, delay: stagger(80), ease: 'outExpo' });
      else animate(h.title, { opacity: [0, 1], translateY: [24, 0], duration: 900, ease: 'outExpo' });
      animate(h.rest, { opacity: [0, 1], translateY: [16, 0], duration: 800, delay: stagger(140, { start: 150 }), ease: 'outExpo' });
      animate(h.title, { '--u': [0, 1], duration: 900, delay: 600, ease: 'outExpo' });
    });
  }, { threshold: .4 });
  $$('[data-head]').forEach((head) => {
    const title = $('.section__title', head);
    const rest = $$('.section__kicker, .section__lead', head);
    let words = [];
    try { words = splitText(title, { words: { wrap: 'clip' } }).words; } catch (_) {}
    utils.set(words, { translateY: '110%' });
    if (!words.length) utils.set(title, { opacity: 0 });
    utils.set(rest, { opacity: 0 });
    utils.set(title, { '--u': 0 });
    head._head = { title, rest, words };
    headIO.observe(head);
  });

  /* ---------- About: paragraphs light up word by word with scroll ---------- */
  $$('.about__text > p').forEach((p) => {
    let words = [];
    try { words = splitText(p, { words: true }).words; } catch (_) {}
    if (!words.length) return;
    p.classList.add('scrub-words');
    scrub(words, { opacity: [.16, 1], duration: 200, delay: stagger(110) }, p, '88% start', '42% end');
  });

  /* ---------- Marquees driven by scroll ---------- */
  $$('[data-marquee]').forEach((m) => {
    const dir = +m.dataset.marquee;
    scrub($('.marquee__track', m), { translateX: dir < 0 ? ['0%', '-34%'] : ['-34%', '0%'] }, m, 'end start', 'start end');
  });

  /* ---------- About: interests panel pops in tag by tag (sticky panel, scrubbed) ---------- */
  scrub('.about__interests .tags li', { scale: [0, 1], opacity: [0, 1], delay: stagger(120), duration: 300, ease: 'outBack' }, '.about__interests', 'end start', '55% start');

  /* ---------- Experience: pinned section, cards travel sideways ---------- */
  const pin = $('#expPin'), track = $('#expTrack');
  await document.fonts.ready;
  const sticky = $('.exp__sticky');
  // If the cards can't fit the screen height (small phones, landscape), fall back to a native swipeable row.
  const native = sticky.scrollHeight > sticky.clientHeight + 4;
  pin.classList.toggle('is-native', native);
  if (!native) {
    // Distance is measured live (not once) so rotation, resizes, font loading and browser-bar changes never leave the last card cut off.
    const dist = () => Math.max(0, track.scrollWidth - pin.clientWidth);
    const sizePin = () => { pin.style.height = `${dist() + innerHeight}px`; };
    const prog = { v: 0 };
    const apply = () => { track.style.transform = `translateX(${(-prog.v * dist()).toFixed(1)}px)`; expTl?.update(prog.v); };
    sizePin();
    const pinOpts = { target: pin, enter: 'start start', leave: 'end end', sync: true };
    const expObs = onScroll(pinOpts);
    animate(prog, { v: [0, 1], ease: 'linear', onUpdate: apply, autoplay: expObs });
    $$('.tl-idx').forEach((n) => animate(n, { translateX: [0, -50], ease: 'linear', autoplay: onScroll(pinOpts) }));
    let rz;
    const relayout = () => { clearTimeout(rz); rz = setTimeout(() => { sizePin(); expTl?.layout(); expObs.refresh?.(); apply(); }, 120); };
    addEventListener('resize', relayout);
    addEventListener('orientationchange', relayout);
    addEventListener('load', relayout);
    new ResizeObserver(relayout).observe(track);
  } else {
    expTl?.layout();
    expTl?.bindNative(track);
  }

  /* ---------- Projects: cards stack, earlier ones recede ---------- */
  const stack = $$('#projectStack .project');
  // Sticky stacking only works when every card fits the screen; otherwise let them scroll normally.
  const fits = stack.every((c) => c.offsetHeight <= innerHeight - (parseFloat(getComputedStyle(c).top) || 0) - 24);
  if (!fits) stack.forEach((c) => { c.style.position = 'relative'; c.style.top = 'auto'; });
  stack.forEach((card, i) => {
    const next = stack[i + 1];
    scrub(card, { opacity: [0, 1], translateY: [80, 0] }, card, 'end start', '70% start');
    if (!next || !fits) return;
    const top = parseFloat(getComputedStyle(next).top);
    scrub(card, { scale: [1, .93], filter: ['brightness(1)', 'brightness(.8)'] }, next, 'end start', `${top}px start`);
  });

  /* ---------- Research: papers swing in like pages, from opposite sides ---------- */
  $$('.paper').forEach((p, i) => {
    const side = i % 2 ? 1 : -1;
    desktop
      ? scrub(p, { opacity: [0, 1], rotate: [side * 7, 0], translateX: [side * 140, 0], translateY: [90, 0] }, p, 'end start', '60% start')
      : scrub(p, { opacity: [0, 1], translateY: [60, 0] }, p, 'end start', '75% start');
  });

  /* ---------- Achievements: awards wipe in, competitions alternate, leadership drops ---------- */
  $$('.award').forEach((a, i) => desktop
    ? scrub(a, { clipPath: ['inset(0 100% 0 0 round 14px)', 'inset(0 0% 0 0 round 14px)'], translateY: [50, 0] }, a, 'end start', `${68 - i * 4}% start`)
    : scrub(a, { opacity: [0, 1], translateY: [50, 0] }, a, 'end start', '78% start'));
  $$('.comp li').forEach((li, i) => scrub(li, { translateX: desktop ? [i % 2 ? 110 : -110, 0] : [i % 2 ? 24 : -24, 0], opacity: [0, 1] }, li, 'end start', '80% start'));
  $$('.lead__item').forEach((l, i) => scrub(l, desktop ? { scale: [.7, 1], rotate: [i % 2 ? 5 : -5, 0], opacity: [0, 1] } : { translateY: [50, 0], opacity: [0, 1] }, l, 'end start', desktop ? '65% start' : '80% start'));

  /* ---------- Skills: groups fold down, chips pop in one by one ---------- */
  $$('.skill-group').forEach((g) => {
    g.style.transformOrigin = '50% 0';
    scrub(g, desktop ? { rotateX: [-80, 0], opacity: [0, 1] } : { translateY: [40, 0], opacity: [0, 1] }, g, 'end start', desktop ? '65% start' : '80% start');
    scrub($$('.chips li', g), { scale: [0, 1], opacity: [0, 1], delay: stagger(90), duration: 250 }, g, '92% start', '55% start');
  });

  /* ---------- Photography: frames open up from the centre, columns drift at different speeds ---------- */
  $$('.cat').forEach((cat, i) => {
    scrub(cat, { clipPath: [desktop ? 'inset(28% 18% 28% 18% round 14px)' : 'inset(14% 10% 14% 10% round 14px)', 'inset(0% 0% 0% 0% round 14px)'] }, cat, 'end start', '65% start');
    if (desktop) scrub(cat, { translateY: [[90, 30, 60][i], [-30, -60, -20][i]] }, '.cats', 'end start', 'start end');
    scrub($('img', cat), { translateY: ['-7%', '7%'] }, cat, 'end start', 'start end');
  });

  /* ---------- Contact: headline letters rise in sequence, box grows ---------- */
  const ct = $('.contact__title');
  let cchars = [];
  try { cchars = splitText(ct, { chars: true }).chars; } catch (_) {}
  if (cchars.length) scrub(cchars, { translateY: ['110%', '0%'], rotate: [12, 0], delay: stagger(40), duration: 200 }, ct, '95% start', '55% end');
  scrub('.contact__box', { scale: [desktop ? .86 : .94, 1] }, '.contact__box', 'end start', '55% start');
  scrub('.contact__list li', { opacity: [0, 1], translateY: [24, 0], delay: stagger(120), duration: 300 }, '.contact__list', '95% start', '60% start');

  /* ---------- Generic reveals + counters ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const o = { v: 0 };
    animate(o, { v: end, duration: 1800, ease: 'outExpo', onUpdate: () => { el.textContent = pre + Math.round(o.v) + suf; } });
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target;
      if (el.matches('[data-stagger], [data-stagger-tags]')) {
        animate([...el.children], { opacity: [0, 1], translateY: [30, 0], scale: [.97, 1], duration: 850, delay: stagger(90), ease: 'outExpo' });
        $$('.stat__num', el).forEach(countUp);
      } else {
        animate(el, { opacity: [0, 1], translateY: [34, 0], duration: 900, ease: 'outExpo' });
      }
    });
  }, { threshold: .15, rootMargin: '0px 0px -5% 0px' });
  $$('[data-reveal], [data-stagger], [data-stagger-tags]').forEach((el) => io.observe(el));

  /* ---------- Hover animations ---------- */
  if (!finePointer) return;

  $$('[data-tilt]').forEach((card) => {
    let raf = 0;
    card.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        animate(card, { rotateY: (x - .5) * 5, rotateX: (.5 - y) * 5, duration: 400, ease: 'outQuad' });
      });
    });
    card.addEventListener('pointerenter', () => {
      const icon = $('.project__icon, .award > i, .skill-group h3 i', card);
      if (icon) animate(icon, { scale: [1, 1.22, 1], rotate: [0, -10, 0], duration: 650, ease: 'outBack' });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf); raf = 0;
      animate(card, { rotateX: 0, rotateY: 0, duration: 900, ease: 'outElastic(1, .6)' });
    });
  });

  $$('[data-magnetic]').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      animate(btn, { translateX: (e.clientX - r.left - r.width / 2) * .22, translateY: (e.clientY - r.top - r.height / 2) * .32, duration: 300, ease: 'outQuad' });
    });
    btn.addEventListener('pointerleave', () => animate(btn, { translateX: 0, translateY: 0, duration: 800, ease: 'outElastic(1, .5)' }));
  });

  $$('.chips li, .tags li').forEach((chip) => {
    chip.addEventListener('pointerenter', () => animate(chip, { translateY: -4, scale: 1.07, duration: 260, ease: 'outQuad' }));
    chip.addEventListener('pointerleave', () => animate(chip, { translateY: 0, scale: 1, duration: 600, ease: 'outElastic(1, .6)' }));
  });

  $$('.hero__social a').forEach((el) => {
    el.addEventListener('pointerenter', () => animate(el, { translateY: -4, rotate: el.classList.contains('brand__mark') ? 360 : 0, duration: 500, ease: 'outBack' }));
    el.addEventListener('pointerleave', () => animate(el, { translateY: 0, rotate: 0, duration: 500, ease: 'outQuad' }));
  });

  $$('.cat').forEach((cat) => {
    const img = $('img', cat), body = $('.cat__body', cat);
    cat.addEventListener('pointerenter', () => {
      animate(img, { scale: 1.09, duration: 900, ease: 'outQuart' });
      animate(body, { translateY: -6, duration: 500, ease: 'outQuart' });
    });
    cat.addEventListener('pointerleave', () => {
      animate(img, { scale: 1, duration: 900, ease: 'outQuart' });
      animate(body, { translateY: 0, duration: 500, ease: 'outQuart' });
    });
  });
  masonry.addEventListener('pointerover', (e) => {
    const f = e.target.closest('figure'); if (f && !f.contains(e.relatedTarget)) animate($('img', f), { scale: 1.06, duration: 600, ease: 'outQuart' });
  });
  masonry.addEventListener('pointerout', (e) => {
    const f = e.target.closest('figure'); if (f && !f.contains(e.relatedTarget)) animate($('img', f), { scale: 1, duration: 600, ease: 'outQuart' });
  });
}

/* =====================================================================
   Smooth scrolling (Lenis) – optional
   ===================================================================== */
async function initSmoothScroll() {
  lenis = new Lenis({ lerp: .09, wheelMultiplier: .95 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const el = id === 'top' ? 0 : document.getElementById(id);
    if (el === null) return;
    e.preventDefault();
    lenis.scrollTo(el, { offset: id === 'top' ? 0 : -60, duration: 1.6 });
  });
}

/* =====================================================================
   Boot
   ===================================================================== */
(async () => {
  expTl = buildExpTimeline();
  if (reduceMotion) {
    root.classList.add('no-anim');
    $('#expPin').classList.add('is-native');   // no pinning without motion: a plain swipeable row
    expTl?.layout();
    expTl?.bindNative($('#expTrack'));
    return;
  }
  try {
    await initSmoothScroll();
    await initAnimations();
  } catch (err) {
    console.warn('Animations disabled:', err);
    A = null;
    root.classList.add('no-anim');
  }
})();
