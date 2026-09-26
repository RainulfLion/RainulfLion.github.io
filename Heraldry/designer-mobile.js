'use strict';
(() => {
  const media = matchMedia('(max-width: 1000px)');
  const app = document.getElementById('app');
  const controls = document.getElementById('mobileControls');
  const tabs = [...document.querySelectorAll('#mobileTabs [role="tab"]')];
  const moved = [];
  let activePane = 'shield';
  let mounted = false;
  function move(node, destination, first = false) {
    const marker = document.createComment('Original position of ' + (node.id || node.className));
    node.before(marker); moved.push({ node, marker });
    if (first) destination.prepend(node); else destination.append(node);
  }
  function showPane(name, focus = false) {
    activePane = name;
    for (const tab of tabs) {
      const selected = tab.dataset.pane === name;
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      document.getElementById('phone-' + tab.dataset.pane).hidden = !selected;
      if (selected && focus) tab.focus();
    }
    controls.scrollTop = 0;
  }
  function viewport() {
    if (!mounted) return;
    // Resize around the on-screen keyboard, while allowing normal pinch zoom.
    if (!window.visualViewport || window.visualViewport.scale === 1)
      document.documentElement.style.setProperty('--editor-height', Math.round(window.visualViewport?.height || innerHeight) + 'px');
  }
  function mount() {
    if (media.matches === mounted) return;
    mounted = media.matches;
    document.body.classList.toggle('phone-layout', mounted);
    if (mounted) {
      for (const [pane, ids] of Object.entries({shield:['p-shape','p-div','p-ord','p-preset'],colors:['p-col','p-style'],charges:['p-charges'],adjust:['p-sel'],save:['p-export']}))
        for (const id of ids) move(document.getElementById(id), document.getElementById('phone-' + pane));
      move(document.querySelector('.toolbar'), document.getElementById('phone-adjust'), true);
      move(document.getElementById('layerList'), document.getElementById('mobileLayers'));
      document.getElementById('dropZone').textContent = 'Tap to choose artwork from your phone';
      showPane(activePane); viewport();
    } else {
      for (const { node, marker } of moved) { marker.replaceWith(node); }
      moved.length = 0;
      document.getElementById('dropZone').innerHTML = 'Drop images here<br>or click to browse (multiple OK)';
      document.documentElement.style.removeProperty('--editor-height');
      app.classList.remove('mobile-full-view');
      document.getElementById('mobileFullView').textContent = 'Full view';
      document.getElementById('mobileFullView').setAttribute('aria-pressed', 'false');
    }
    requestAnimationFrame(drawHandles);
  }
  tabs.forEach((tab, index) => {
    tab.onclick = () => showPane(tab.dataset.pane);
    tab.onkeydown = event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); showPane(tabs[next].dataset.pane, true); }
    };
  });
  document.getElementById('mobileFullView').onclick = event => {
    const full = app.classList.toggle('mobile-full-view');
    event.currentTarget.textContent = full ? 'Edit' : 'Full view';
    event.currentTarget.setAttribute('aria-pressed', String(full));
    requestAnimationFrame(drawHandles);
  };
  document.getElementById('mobileAddText').onclick = addTextLayer;
  document.addEventListener('heraldry-charge-added', () => { if (mounted) showPane('adjust'); });
  document.querySelectorAll('[data-nudge]').forEach(button => button.onclick = () => {
    const layer = state.layers.find(item => item.id === state.sel); if (!layer) return;
    const direction = button.dataset.nudge;
    layer.x += direction === 'left' ? -3 : direction === 'right' ? 3 : 0;
    layer.y += direction === 'up' ? -3 : direction === 'down' ? 3 : 0;
    renderLayers(); drawHandles();
  });
  function selectionChanged() {
    const selected = state.layers.some(item => item.id === state.sel);
    document.querySelectorAll('[data-nudge]').forEach(button => button.disabled = !selected);
    document.getElementById('touchHint').textContent = selected ? 'Drag to move. Use Adjust to resize or rotate.' : 'Tap a charge to select it. Drag to move.';
  }
  new MutationObserver(selectionChanged).observe(document.getElementById('selBody'), { childList: true });
  media.addEventListener('change', mount);
  window.addEventListener('resize', viewport);
  window.visualViewport?.addEventListener('resize', viewport);
  new ResizeObserver(() => requestAnimationFrame(drawHandles)).observe(document.getElementById('stagewrap'));
  mount(); selectionChanged();

  const dialog = document.getElementById('phoneExport');
  let exportUrl;
  let exportFile;
  window.presentPhoneExport = blob => {
    exportUrl = URL.createObjectURL(blob);
    exportFile = new File([blob], 'coat-of-arms.png', { type: 'image/png' });
    document.getElementById('phoneExportImage').src = exportUrl;
    document.getElementById('phoneDownload').href = exportUrl;
    let shareable = false;
    try { shareable = !!navigator.canShare?.({ files: [exportFile] }); } catch { /* Use Download. */ }
    document.getElementById('phoneShare').hidden = !shareable;
    document.getElementById('phoneShareStatus').textContent = '';
    document.getElementById('phoneExportHelp').textContent = shareable
      ? 'Tap Share / Save image to choose Photos, Files, or another app. You can also download the PNG.'
      : 'Tap Download PNG to save the image to your phone’s downloads or Files.';
    dialog.showModal();
  };
  document.getElementById('phoneShare').onclick = async () => {
    try { await navigator.share({ files: [exportFile], title: 'My coat of arms' }); }
    catch (error) { if (error.name !== 'AbortError') document.getElementById('phoneShareStatus').textContent = 'Sharing is unavailable. Use Download PNG instead.'; }
  };
  document.getElementById('closePhoneExport').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    const oldUrl = exportUrl; exportUrl = null; exportFile = null;
    document.getElementById('phoneExportImage').removeAttribute('src');
    setTimeout(() => URL.revokeObjectURL(oldUrl), 60000);
  });
})();
