// The basin silhouette stays in place; two travelling sine waves add movement.
// Time is measured in seconds and all dimensions use the SVG viewBox.
export const WAVE_SETTINGS = Object.freeze({
  width: 1440,
  height: 1000,
  samples: 72,
  amplitude: 5.5,
  speed: 0.26,
  backOffset: 14,
  frameRate: 30,
});

// Art-directed heights in the area above the fixed information strip.
export const SCENE_PROFILES = Object.freeze({
  home: [845, 885, 945, 860, 735],
  about: [510, 550, 575, 505, 445],
  drinks: [670, 730, 720, 620, 590],
  reservation: [475, 495, 520, 495, 475],
  contact: [395, 470, 540, 510, 430],
});

export const COMPACT_PROFILES = Object.freeze({
  home: SCENE_PROFILES.home,
  drinks: [545, 590, 595, 530, 480],
  about: [350, 385, 400, 350, 295],
  reservation: [300, 320, 340, 320, 300],
  contact: [330, 380, 400, 360, 300],
});
export const WIDE_PROFILES = Object.freeze({
  home: [835, 880, 930, 800, 770],
  drinks: [140, 215, 180, 590, 800],
  about: [155, 225, 195, 610, 790],
  reservation: [140, 175, 195, 175, 140],
  contact: [145, 230, 195, 620, 830],
});

function profileHeight(u, profile) {
  const position = Math.min(u, 0.999999) * (profile.length - 1);
  const index = Math.floor(position);
  const t = position - index;
  const a = profile[Math.max(0, index - 1)];
  const b = profile[index];
  const c = profile[index + 1];
  const d = profile[Math.min(profile.length - 1, index + 2)];
  return 0.5 * ((2 * b) + (-a + c) * t + (2*a - 5*b + 4*c - d) * t*t + (-a + 3*b - 3*c + d) * t*t*t);
}

export function waveY(u, seconds, layer = 0, settings = WAVE_SETTINGS, blend = {from:'home', to:'home', mix:0}) {
  const profiles = settings.profiles || SCENE_PROFILES;
  // Lift the left edge smoothly below the header on short landscape screens;
  // don't clamp the curve into a flat line with a sharp corner.
  const height = (profile,scene) => profileHeight(u, profile) + Math.max(0, (settings.topLimit || 0) - profile[0]) * (scene==='reservation'?1:(1-u));
  const from = height(profiles[blend.from] || profiles.home,blend.from);
  const to = height(profiles[blend.to] || profiles.home,blend.to);
  const basin = from + (to - from) * blend.mix;
  const phase = seconds * settings.speed;
  const drift = Math.sin(u * Math.PI * 2 - phase + layer * 1.2);
  const ripple = Math.sin(u * Math.PI * 4 + phase * 0.7 + layer * 0.8);
  const transition = Math.sin(blend.mix * Math.PI);
  const symmetry=(blend.from==='reservation'?1-blend.mix:0)+(blend.to==='reservation'?blend.mix:0);
  const mirrorDrift=Math.sin((1-u)*Math.PI*2-phase+layer*1.2),mirrorRipple=Math.sin((1-u)*Math.PI*4+phase*.7+layer*.8);
  const motion=(drift+ripple*.35)*(1-symmetry*.5)+(mirrorDrift+mirrorRipple*.35)*symmetry*.5;
  return basin + settings.amplitude * (1 + transition * 2.5) * motion - layer * settings.backOffset;
}

export function wavePath(seconds, layer = 0, settings = WAVE_SETTINGS, blend) {
  let path = '';
  for (let i = 0; i <= settings.samples; i += 1) {
    const u = i / settings.samples;
    path += `${i ? 'L' : 'M'}${(u * settings.width).toFixed(1)} ${waveY(u, seconds, layer, settings, blend).toFixed(2)}`;
  }
  return `${path}L${settings.width} ${settings.height}L0 ${settings.height}Z`;
}

export function mountWave(container, button) {
  const front = container.querySelector('[data-wave-front]');
  const back = container.querySelector('[data-wave-back]');
  if (!front || !back || !button) return null;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let motionReduced = reducedMotion.matches;
  let userPaused = false;
  let inView = true;
  let frame = null;
  let lastTime = null;
  let lastDraw = -Infinity;
  let elapsed = 0;
  let blend = {from:'home', to:'home', mix:0};
  let profiles = SCENE_PROFILES;
  let topLimit = 0;

  const draw = () => {
    const settings = {...WAVE_SETTINGS, profiles, topLimit, amplitude: motionReduced ? 0 : WAVE_SETTINGS.amplitude};
    front.setAttribute('d', wavePath(elapsed, 0, settings, blend));
    back.setAttribute('d', wavePath(elapsed, 1, settings, blend));
  };
  const canRun = () => !motionReduced && !userPaused && inView && !document.hidden;
  const tick = (now) => {
    frame = null;
    if (!canRun()) return;
    if (lastTime !== null) elapsed += Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    if (now - lastDraw >= 1000 / WAVE_SETTINGS.frameRate) {
      draw();
      lastDraw = now;
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    const label = motionReduced ? button.dataset.reduced : userPaused ? button.dataset.play : button.dataset.pause;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.disabled = motionReduced;
    button.classList.toggle('is-paused', motionReduced || userPaused);
    if (motionReduced) { elapsed = 0; draw(); }
    if (canRun() && frame === null) {
      lastTime = null;
      frame = requestAnimationFrame(tick);
    } else if (!canRun()) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
    }
  };
  const toggle = () => { userPaused = !userPaused; sync(); };
  // Read preference changes from the event, not from each animation frame.
  const preferenceChanged = (event) => { motionReduced = event.matches; sync(); };
  const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
  // One CSS-selected layout contract; no UA checks or layout reads per frame.
  const resize = new ResizeObserver(() => {
    const layout = getComputedStyle(document.body).getPropertyValue('--wave-layout').trim();
    profiles = layout === 'wide' ? WIDE_PROFILES : layout === 'compact' ? COMPACT_PROFILES : SCENE_PROFILES;
    topLimit = layout === 'wide' ? 72 / Math.max(container.clientHeight, 1) * WAVE_SETTINGS.height : 0;
    container.dataset.waveLayout = layout;
    draw();
  });
  observer.observe(container);
  resize.observe(container);
  container.hidden = false;
  button.hidden = false;
  button.addEventListener('click', toggle);
  reducedMotion.addEventListener('change', preferenceChanged);
  document.addEventListener('visibilitychange', sync);
  draw();
  sync();

  return {setBlend(from, to, mix) { blend = {from, to, mix}; draw(); }, destroy() {
    if (frame !== null) cancelAnimationFrame(frame);
    observer.disconnect();
    resize.disconnect();
    button.removeEventListener('click', toggle);
    reducedMotion.removeEventListener('change', preferenceChanged);
    document.removeEventListener('visibilitychange', sync);
  }};
}
