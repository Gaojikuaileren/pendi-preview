// The stone texture on the dark home background must never lie over the film (r4).
// Publish where the film starts and the width of its soft left edge, and whether it is
// showing, for the mask in site.css. Before the film is ready the whole ground is dark.
export function mountFilmTexture(video) {
  const ground = video?.closest('.experience');
  if (!ground) return;
  const update = () => {
    const box = ground.getBoundingClientRect(), film = video.getBoundingClientRect();
    ground.style.setProperty('--film-left', `${Math.max(0, film.left - box.left).toFixed(1)}px`);
    ground.style.setProperty('--film-fade', `${(film.width * .18).toFixed(1)}px`);
  };
  const sync = () => ground.toggleAttribute('data-film-ready', video.classList.contains('is-ready'));
  const observer = new ResizeObserver(update);
  observer.observe(ground);
  observer.observe(video);
  new MutationObserver(sync).observe(video, {attributes: true, attributeFilter: ['class']});
  update();
  sync();
}
