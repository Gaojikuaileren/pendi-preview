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
  const atAnchor = () => Math.abs(progress - Math.round(progress)) < 0.00001;
  // currentTime may be rounded by the browser. Accept the target frame, not a
  // microsecond match; the seek target still lies inside the original frame.
  const sameFrame = (time, target) => Number.isFinite(time) && Math.min(Math.ceil(video.duration * fps - 1e-6) - 1, Math.floor(time * fps + 1e-6)) === Math.floor(target * fps + 1e-6);
  // Decoded timestamps describe frame starts and may themselves be rounded
  // (e.g. 191 / 24 becomes 7.958333). Round those to their frame index; a
  // currentTime seek position is inside a frame and must instead be floored.
  const arrived = () => ready && !video.seeking && (decodedTime === null ? sameFrame(video.currentTime, desired) : Math.round(decodedTime * fps) === Math.floor(desired * fps + 1e-6));
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
    if (caughtUp) visible = true;
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
  function flush() {
    scheduled = false;
    if (failed || !ready || !anchors.length || video.seeking) return;
    if (!arrived()) { decodedTime = null; video.currentTime = desired; }
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
  video.addEventListener('loadeddata', () => { ready = true; video.pause(); update(); });
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
    update();
  }).catch(() => { failed = true; render(); });
  if (video.readyState >= 2) { ready = true; video.pause(); }
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
