// Original station photographs and local repairs are baked into this one MP4.
// Never play it: seek the source timeline, including the original anchor frames.
import {reducedMotion} from './motion-policy.js?v=e36b16075409';
export function mountScrollVideo(video, {onFrame} = {}) {
  if (!video) return null;
  const reduced = reducedMotion;
  const scenes = [...document.querySelectorAll('[data-deck] [data-scene]')].map(scene => scene.dataset.scene);
  let anchors = [], progress = 0, desired = 0, frameOffset = 0, fps = 24;
  let ready = false, visible = false, failed = false, scheduled = false;
  let decodedTime = null;
  let pendingStation = null;
  // The last seek target and how often it was requested; a target accepted after
  // repeated seeks; and the decoder priming state (see prime()).
  let seekTarget = null, seekCount = 0, accepted = null, priming = false, primes = 0, watchdog = 0;
  // ?video-debug lists the media events and states on the page, for checks on real
  // phones and tablets (iOS WebKit cannot be run on the development machine).
  const debug = new URLSearchParams(location.search).has('video-debug') ? document.body.appendChild(document.createElement('pre')) : null;
  if (debug) Object.assign(debug.style, {position: 'fixed', zIndex: 99, left: '8px', right: '8px', bottom: '8px', maxHeight: '45vh', overflow: 'auto', margin: 0, padding: '8px', font: '11px/1.35 monospace', color: '#fff', background: '#000c', whiteSpace: 'pre-wrap', pointerEvents: 'none'});
  const log = message => { if (debug) debug.textContent = `${(performance.now() / 1000).toFixed(2)} ${message} · rs ${video.readyState} ns ${video.networkState} t ${video.currentTime.toFixed(3)}${video.seeking ? ' seeking' : ''}${video.paused ? '' : ' playing'}${visible ? ' visible' : ''}\n${debug.textContent}`.slice(0, 6000); };
  if (debug) for (const type of ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'seeking', 'seeked', 'play', 'playing', 'pause', 'waiting', 'stalled', 'suspend', 'emptied', 'error']) video.addEventListener(type, () => log(type));
  const atAnchor = () => Math.abs(progress - Math.round(progress)) < 0.00001;
  // currentTime may be rounded by the browser. Accept the target frame, not a
  // microsecond match; the seek target still lies inside the original frame.
  const sameFrame = (time, target) => Number.isFinite(time) && Math.min(Math.ceil(video.duration * fps - 1e-6) - 1, Math.floor(time * fps + 1e-6)) === Math.floor(target * fps + 1e-6);
  // Decoded timestamps describe frame starts and may themselves be rounded
  // (e.g. 191 / 24 becomes 7.958333), so they are rounded to their frame index.
  // WebKit may report the requested position inside the frame instead, which is
  // floored like currentTime; either reading of the target frame counts.
  const decodedOn = (time, target) => { const frame = Math.floor(target * fps + 1e-6); return Math.round(time * fps) === frame || Math.floor(time * fps + 1e-6) === frame; };
  // A frame counts only once the element holds decoded data (readyState 2+): iOS
  // WebKit loads metadata alone until a seek or a playback start asks for frames.
  const arrived = () => ready && !video.seeking && video.readyState >= 2 && (accepted === desired || (decodedTime === null ? sameFrame(video.currentTime, desired) : decodedOn(decodedTime, desired)));
  const setState = (key, value) => { if (video.dataset[key] !== value) video.dataset[key] = value; };
  function delivered(time){if(pendingStation!==null||!anchors.length||!onFrame)return;let i=0;while(i<anchors.length-1&&time>=anchors[i+1])i++;const next=Math.min(i+1,anchors.length-1);const mix=next===i?0:Math.max(0,Math.min(1,(time-anchors[i])/(anchors[next]-anchors[i])));onFrame(i+mix);}
  if(video.requestVideoFrameCallback){const decoded=(now,meta)=>{decodedTime=meta.mediaTime;delivered(meta.mediaTime);render();video.requestVideoFrameCallback(decoded);};video.requestVideoFrameCallback(decoded);}

  function render() {
    // With no decoded frames, keep the readable paper aligned to the scene.
    if(failed)onFrame?.(progress);
    const caughtUp = anchors.length > 0 && arrived();
    if(pendingStation!==null&&(caughtUp||failed)){
      pendingStation=null;
      onFrame?.(progress);
    }
    // Don't flash home on a deep link; retain the decoded frame during seeks.
    if (caughtUp && !visible) { visible = true; clearTimeout(watchdog); disarm(); log('shown'); }
    video.classList.toggle('is-ready', visible && !failed && pendingStation===null);
    setState('displayMode', failed ? 'error' : visible && pendingStation===null ? 'video' : 'loading');
    const feedback = document.querySelector('[data-media-feedback]');
    if (feedback) {
      const mode = video.dataset.displayMode;
      const copy = mode === 'video' ? '' : feedback.dataset[mode];
      if (feedback.textContent !== copy) feedback.textContent = copy;
      // A deliberate station seek is part of navigation, not an initial load.
      // Keep the boxed status out of the fade; persistent failures reappear
      // when the transition ends and render() runs for the destination.
      feedback.hidden = mode === 'video' || document.querySelector('[data-deck]')?.dataset.transitionMode==='direct';
    }
    setState('station', !failed && caughtUp && (atAnchor() || reduced.matches) ? String(Math.round(progress)) : '');
  }
  // iOS can hold back frames: it may load nothing, not even the metadata, until
  // playback is requested, or leave a seek pending until data arrives. A muted
  // inline play() that is paused at once makes it load and decode; nothing shows,
  // because the film appears only when the target frame has arrived. It runs when
  // a seek brought no frame, when there is still no frame 1.5 and 4 seconds after
  // loading starts, and on every touch, click or key press until the film shows
  // (playback can need a gesture, as in Low Power Mode).
  const unlockEvents = ['touchend', 'pointerup', 'click', 'keydown'];
  function unlock() { if (!visible) { log('gesture'); prime(true); } }
  function arm() { unlockEvents.forEach(type => window.addEventListener(type, unlock, {capture: true, passive: true})); }
  function disarm() { unlockEvents.forEach(type => window.removeEventListener(type, unlock, true)); }
  function watch(delay) {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => { if (failed || visible) return; log('no frame yet'); if (video.readyState < 2) prime(); if (delay < 4000) watch(4000); }, delay);
  }
  function prime(fromGesture = false) {
    if (priming || failed || (!fromGesture && primes >= 3)) return;
    priming = true; primes++;
    video.muted = true; video.playsInline = true;
    log('prime' + (fromGesture ? ' (gesture)' : ''));
    let settled = false, timer = 0;
    const resume = () => { if (settled) return; settled = true; clearTimeout(timer); priming = false; video.pause(); seekTarget = null; schedule(); };
    // A play() that neither starts nor fails (WebKit can hold it back) must not
    // block the later tries: give up on it after two seconds.
    timer = setTimeout(() => { log('play timeout'); resume(); }, 2000);
    let attempt;
    try { attempt = video.play(); } catch (error) { attempt = Promise.reject(error); }
    Promise.resolve(attempt).then(() => { log('play resolved'); resume(); }, error => {
      log('play rejected ' + (error?.name || error));
      if (error?.name !== 'NotAllowedError') { resume(); return; }
      settled = true; clearTimeout(timer); priming = false;
    });
  }
  function flush() {
    scheduled = false;
    if (failed || !ready || !anchors.length || video.seeking || priming) return;
    if (!arrived()) {
      if (seekTarget !== desired) { seekTarget = desired; seekCount = 0; }
      // A seek that brought no frame data primes the decoder instead of seeking
      // again. After three seeks that still report a neighbouring frame, the
      // target counts as reached, so a rounding difference cannot hide the film.
      if (seekCount > 0 && video.readyState < 2) prime();
      else if (seekCount < 3) { seekCount++; decodedTime = null; video.currentTime = desired; }
      else accepted = desired;
    }
    render();
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
  }
  function update() {
    if (anchors.length && Number.isFinite(video.duration)) {
      // Reduced motion uses the same file but jumps directly between stations.
      const position = reduced.matches ? Math.round(progress) : progress;
      const from = Math.min(anchors.length - 1, Math.floor(position));
      const to = Math.min(anchors.length - 1, from + 1);
      const time = anchors[from] + (anchors[to] - anchors[from]) * (position - from);
      // Seek inside the frame, not its floating-point boundary.
      desired = Math.min(video.duration - frameOffset, time + frameOffset);
      schedule();
    }
    render();
  }
  // Start from the metadata: iOS WebKit downgrades preload="auto" to metadata and
  // may never fire loadeddata until something asks for a frame (until 2026-11-12
  // the film waited for loadeddata and stayed hidden on iPhones).
  video.addEventListener('loadedmetadata', () => { ready = true; update(); });
  video.addEventListener('loadeddata', () => { ready = true; if (!priming) video.pause(); update(); });
  video.addEventListener('canplay', schedule);
  video.addEventListener('seeking', () => { decodedTime = null; render(); });
  video.addEventListener('seeked', () => { schedule(); render(); if(!video.requestVideoFrameCallback)delivered(video.currentTime-frameOffset); });
  video.addEventListener('error', () => { failed = true; render(); });
  reduced.addEventListener('change', update);
  fetch(video.dataset.timeline).then(response => {
    if (!response.ok) throw new Error('Missing local video timeline');
    return response.json();
  }).then(data => {
    if (!Array.isArray(data.anchors) || data.anchors.length !== scenes.length || data.anchors.some((t,i) => !Number.isFinite(t) || t < 0 || (i > 0 && t <= data.anchors[i-1]))) throw new Error('Invalid local video timeline');
    if (!Array.isArray(data.scenes) || data.scenes.length !== scenes.length || data.scenes.some((scene,i) => scene !== scenes[i])) throw new Error('Video timeline and page order differ');
    if (!Number.isFinite(data.fps) || data.fps <= 0) throw new Error('Invalid video frame rate');
    fps = data.fps;
    frameOffset = data.seekFrameOffsetSeconds ?? 1 / (2 * fps);
    if (!Number.isFinite(frameOffset) || frameOffset <= 0 || frameOffset >= 1 / fps) throw new Error('Invalid frame seek offset');
    anchors = data.anchors;
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
    arm(); watch(1500);
    update();
  }).catch(() => { failed = true; render(); });
  if (video.readyState >= 1) { ready = true; video.pause(); }
  render();
  return {
    setProgress(value) {
      progress = Math.max(0, Math.min(scenes.length - 1, value));
      if(pendingStation!==null&&progress!==pendingStation)pendingStation=null;
      if(!atAnchor())delete video.dataset.jumpSeek;
      update();
    },
    seekStation(value) {
      progress=Math.max(0,Math.min(scenes.length-1,Math.round(value)));
      pendingStation=progress;
      video.dataset.jumpSeek='true';
      update();
    },
    isSettled() {return failed||(pendingStation===null&&arrived());},
  };
}
