// Pendi plays its motion on every device. A system "reduce motion" preference no longer
// switches the site to static scenes (product decision 2026-10-03); the pause button in the
// header stays enabled everywhere and is the visitor's control. A media query that never
// matches keeps the MediaQueryList API (.matches, change events) the modules already use.
export const reducedMotion = matchMedia('not all');
