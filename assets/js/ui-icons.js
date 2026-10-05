// Decorative UI vectors, never font glyphs or platform emoji. Works as a
// classic deferred script in the admin and a side-effect import in the site.
(() => {
  const paths = {
    forward: 'M4 12h16m-6-6 6 6-6 6',
    back: 'M20 12H4m6-6-6 6 6 6',
    external: 'M5 19 19 5M5 5h14v14',
    close: 'm6 6 12 12M18 6 6 18',
  };
  window.pendiUIIcon = (name, className = '') => {
    if (!Object.hasOwn(paths, name)) throw new TypeError('Unknown UI icon');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [key, value] of Object.entries({
      class: 'ui-icon' + (className ? ' ' + className : ''),
      'data-ui-icon': name, viewBox: '0 0 24 24', width: '20', height: '20',
      'aria-hidden': 'true', focusable: 'false', fill: 'none',
      stroke: 'currentColor', 'stroke-width': '1.5',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    })) svg.setAttribute(key, value);
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', paths[name]);
    svg.append(path);
    return svg;
  };
})();
