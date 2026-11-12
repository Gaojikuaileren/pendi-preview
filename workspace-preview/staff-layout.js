// Shared presentation only: no API calls, permission decisions or data writes.
export function mountStaffPresentation(root, state = {}) {
  if (!root) return () => {};
  root.dataset.staffPresentation = 'ready';
  const compact = matchMedia('(max-width:700px), (max-width:1000px) and (max-height:500px)');
  const abort = new AbortController(), signal = abort.signal;
  const initialized = new WeakSet();
  state.open ??= {}; state.query ??= '';
  const search = root.querySelector('[data-staff-search]');
  if (search) search.value = state.query;
  const rows = () => [...root.querySelectorAll('[data-staff-row]')];
  const filter = () => {
    const query = String(state.query).trim().toLocaleLowerCase();
    const list = rows(); let shown = 0;
    for (const row of list) {
      const text = (row.querySelector('[name=name]')?.value || '') + ' ' + (row.querySelector('.staff-email')?.textContent || '');
      row.hidden = !!query && !text.toLocaleLowerCase().includes(query);
      if (!row.hidden) shown++;
    }
    const count = root.querySelector('[data-staff-count]'), value = `${shown} / ${list.length}`;
    if (count && count.textContent !== value) count.textContent = value;
  };
  const prepare = () => {
    for (const row of rows()) {
      const details = row.querySelector('[data-staff-permissions]');
      if (!details) continue;
      const switches = [...details.querySelectorAll('input[name^="permissions["]')];
      const count = details.querySelector('[data-permission-count]'), value = `${switches.filter(el => el.checked).length} / ${switches.length}`;
      if (count && count.textContent !== value) count.textContent = value;
      if (!initialized.has(details)) {
        initialized.add(details);
        details.open = !compact.matches || state.open[row.dataset.staffRow] === true;
        details.addEventListener('toggle', () => {
          if (compact.matches) state.open[row.dataset.staffRow] = details.open;
        }, {signal});
      }
    }
    filter();
  };
  search?.addEventListener('input', () => {state.query = search.value; filter();}, {signal});
  root.addEventListener('change', prepare, {signal});
  compact.addEventListener('change', () => {
    for (const row of rows()) {
      const details = row.querySelector('[data-staff-permissions]');
      if (details) details.open = !compact.matches || state.open[row.dataset.staffRow] === true;
    }
  }, {signal});
  const observer = new MutationObserver(prepare);
  const list = root.querySelector('.staff-list');
  if (list) observer.observe(list, {childList:true,subtree:true});
  prepare();
  return () => {
    if(compact.matches)for(const row of rows()){const details=row.querySelector('[data-staff-permissions]');if(details)state.open[row.dataset.staffRow]=details.open;}
    abort.abort();observer.disconnect();
  };
}
