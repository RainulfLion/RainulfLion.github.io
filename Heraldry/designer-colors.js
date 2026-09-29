'use strict';

// Keep the source image embedded and untouched. SVG filters preserve its alpha
// channel and work in the editor as well as standalone SVG and PNG exports.
function paintNode(tag, attributes = {}) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function layerColorMode(layer) {
  return layer.colorMode || (layer.type === 'image' ? 'original' : 'solid');
}

function imageColorFilter(layer, color, suffix) {
  const id = `charge-color-${layer.id}-${suffix}`;
  const filter = paintNode('filter', {
    id, 'data-layer-paint': '', x: '-5%', y: '-5%', width: '110%', height: '110%',
    'color-interpolation-filters': 'sRGB'
  });
  if (layer.keepDetails) {
    // Recolor light areas while retaining the dark linework and shading.
    filter.appendChild(paintNode('feColorMatrix', {
      type: 'matrix', values: '0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0'
    }));
    const transfer = paintNode('feComponentTransfer');
    ['R', 'G', 'B'].forEach((channel, i) => {
      const value = parseInt(color.slice(1 + i * 2, 3 + i * 2), 16) / 255;
      transfer.appendChild(paintNode(`feFunc${channel}`, { type: 'linear', slope: value }));
    });
    filter.appendChild(transfer);
  } else {
    filter.appendChild(paintNode('feFlood', { 'flood-color': color, result: 'ink' }));
    filter.appendChild(paintNode('feComposite', { in: 'ink', in2: 'SourceAlpha', operator: 'in' }));
  }
  defs.appendChild(filter);
  return `url(#${id})`;
}

function counterchangeColors() {
  const colors = DIVS[state.division].paths().map((_, i) => getFill(i).color.toLowerCase());
  const palette = [...new Set(colors)];
  return { colors, palette };
}

function colorLayerArtwork(layer, artwork, element) {
  if (layer.type === 'text') return artwork;
  const mode = layerColorMode(layer);
  if (mode === 'original') return artwork;
  const paint = (node, color, suffix) => {
    if (layer.type === 'image') node.setAttribute('filter', imageColorFilter(layer, color, suffix));
    else node.setAttribute('fill', color);
  };
  if (mode === 'solid') {
    paint(element, layer.color || '#ffcc00', 'solid');
    return artwork;
  }

  const counter = mode === 'counterchanged';
  const division = counter ? state.division : (layer.colorSplit || 'perPale');
  const { colors, palette } = counterchangeColors();
  const result = paintNode('g');
  DIVS[division].paths().forEach((path, i) => {
    const id = `charge-split-${layer.id}-${i}`;
    const clip = paintNode('clipPath', { id, clipPathUnits: 'userSpaceOnUse', 'data-layer-paint': '' });
    clip.appendChild(paintNode('path', { d: path }));
    defs.appendChild(clip);
    let color;
    if (counter) {
      const index = palette.indexOf(colors[i]);
      const step = layer.swapColors ? 0 : 1;
      color = palette.length > 1 ? palette[(index + step) % palette.length] : (layer.color || '#ffcc00');
    } else {
      // Alternate diagonally in quarterly, rather than making another pale.
      const alternate = division === 'quarterly' ? [0, 1, 1, 0][i] : i % 2;
      color = alternate ? (layer.color2 || '#f7f7f5') : (layer.color || '#1b1b1b');
    }
    const copy = artwork.cloneNode(true);
    paint(copy.firstElementChild, color, i);
    const region = paintNode('g', { 'clip-path': `url(#${id})` });
    region.appendChild(copy);
    result.appendChild(region);
  });
  return result;
}

function layerColorControls(layer) {
  const mode = layerColorMode(layer);
  const options = [
    ...(layer.type === 'image' ? [['original', 'Original colors']] : []),
    ['solid', 'One color'], ['split', 'Two colors (split)'], ['counterchanged', 'Counterchanged (field colors)']
  ];
  const splitNames = { perPale: 'Left / right', perFess: 'Top / bottom', perBend: 'Diagonal ↘', perBendS: 'Diagonal ↙', quarterly: 'Quartered' };
  return `<label class="fld" for="sColorMode">Color style</label>
    <select id="sColorMode">${options.map(([value, label]) => `<option value="${value}" ${mode === value ? 'selected' : ''}>${label}</option>`).join('')}</select>
    <div id="sColorOptions" ${mode === 'original' || mode === 'counterchanged' ? 'hidden' : ''}>
      <label class="fld" for="sColor">${mode === 'split' ? 'First color' : 'Charge color'}</label>
      <input type="color" id="sColor" value="${layer.color || '#ffcc00'}">
      <div ${mode === 'split' ? '' : 'hidden'}>
        <label class="fld" for="sColor2">Second color</label><input type="color" id="sColor2" value="${layer.color2 || '#f7f7f5'}">
        <label class="fld" for="sColorSplit">Color division</label>
        <select id="sColorSplit">${Object.entries(splitNames).map(([value, label]) => `<option value="${value}" ${(layer.colorSplit || 'perPale') === value ? 'selected' : ''}>${label}</option>`).join('')}</select>
      </div>
    </div>
    <button class="btn sm" id="sSwapColors" style="margin-top:8px" ${mode === 'split' || mode === 'counterchanged' ? '' : 'hidden'}>⇄ Swap colors</button>
    ${layer.type === 'image' ? `<label class="toggle" ${mode === 'original' ? 'hidden' : ''}><input type="checkbox" id="sKeepDetails" ${layer.keepDetails ? 'checked' : ''}> Keep dark details &amp; shading</label>
      <p class="hint" ${mode === 'original' ? '' : 'hidden'}>Choose a color style to recolor this image. Original colors restores the source artwork.</p>` : ''}
    <p class="hint" id="sCounterHint" ${mode === 'counterchanged' ? '' : 'hidden'}></p>
    <p class="hint" ${mode === 'split' ? '' : 'hidden'}>The color division stays aligned with the shield as you move or rotate the charge.</p>`;
}

function syncCounterHint() {
  const hint = document.getElementById('sCounterHint');
  if (!hint || hint.hidden) return;
  const { palette } = counterchangeColors();
  const layer = state.layers.find(item => item.id === state.sel);
  hint.textContent = palette.length < 2
    ? 'Choose a divided field with two different colors to swap them across this charge.'
    : layer?.swapColors
      ? 'Colors now match the field. Swap again to restore counterchanging; an outline can keep matching charges visible.'
    : palette.length === 2
      ? 'Reverses the two field colors across this charge. Updates when the field changes; ignores ordinaries and patterns.'
      : 'Cycles the field colors across this charge. Use two field colors for a direct color swap.';
}

function bindLayerColorControls(layer) {
  const on = (id, event, handler) => document.getElementById(id)?.addEventListener(event, handler);
  on('sColorMode', 'change', event => {
    layer.colorMode = event.target.value;
    layer.swapColors = false;
    render(); syncSelPanel(); buildLayerList();
  });
  on('sColor2', 'input', event => { layer.color2 = event.target.value; render(); });
  on('sColorSplit', 'change', event => { layer.colorSplit = event.target.value; render(); });
  on('sKeepDetails', 'change', event => { layer.keepDetails = event.target.checked; render(); });
  on('sSwapColors', 'click', () => {
    if (layerColorMode(layer) === 'counterchanged') layer.swapColors = !layer.swapColors;
    else [layer.color, layer.color2] = [layer.color2 || '#f7f7f5', layer.color || '#1b1b1b'];
    render(); syncSelPanel(); buildLayerList();
  });
  syncCounterHint();
}
