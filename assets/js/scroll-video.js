// Original station photographs and local repairs are baked into this one MP4.
// Never play it: seek the source timeline, including the original anchor frames.
export function mountScrollVideo(video, {onFrame} = {}) {
  if (!video) return null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [...document.querySelectorAll('[data-deck] [data-scene]')].map(scene => scene.dataset.scene);
  let anchors = [], progress = 0, desired = 0, frameOffset = 0, fps = 24;
  let ready = false, visible = false, failed = false, scheduled = false;
  const atAnchor = () => Math.abs(progress - Math.round(progress)) < 0.00001;
  function delivered(time){if(!anchors.length||!onFrame)return;let i=0;while(i<anchors.length-1&&time>=anchors[i+1])i++;const next=Math.min(i+1,anchors.length-1);const mix=next===i?0:Math.max(0,Math.min(1,(time-anchors[i])/(anchors[next]-anchors[i])));onFrame(i+mix);}
  if(onFrame&&video.requestVideoFrameCallback){const decoded=(now,meta)=>{delivered(meta.mediaTime);video.requestVideoFrameCallback(decoded);};video.requestVideoFrameCallback(decoded);}

  function render() {
    // With no decoded frames, keep the readable paper aligned to the scene.
    if(failed)onFrame?.(progress);
    const caughtUp = ready && !video.seeking && Math.abs(video.currentTime - desired) < 0.00001;
    // Don't flash home on a deep link; retain the decoded frame during seeks.
    if (caughtUp) visible = true;
    video.classList.toggle('is-ready', visible && !failed);
    video.dataset.displayMode = failed ? 'error' : visible ? 'video' : 'loading';
    const feedback = document.querySelector('[data-media-feedback]');
    if (feedback) {
      const mode = video.dataset.displayMode;
      const copy = mode === 'video' ? '' : feedback.dataset[mode];
      if (feedback.textContent !== copy) feedback.textContent = copy;
      feedback.hidden = mode === 'video';
    }
    video.dataset.station = caughtUp && (atAnchor() || reduced.matches) ? String(Math.round(progress)) : '';
  }
  function flush() {
    scheduled = false;
    if (failed || !ready || !anchors.length || video.seeking) return;
    const tolerance = atAnchor() || reduced.matches ? 0.000001 : 1 / (2 * fps);
    if (Math.abs(video.currentTime - desired) > tolerance) video.currentTime = desired;
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
  render();
  return {
    setProgress(value) {
      progress = Math.max(0, Math.min(scenes.length - 1, value));
      update();
    },
  };
}
