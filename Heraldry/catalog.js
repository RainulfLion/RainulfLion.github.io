'use strict';
const $ = id => document.getElementById(id);
const categoryNames = ['All charges', 'Beasts', 'Birds', 'Mythical', 'Plants', 'Symbols', 'Objects'];
const state = { assets: [], category: 'All charges', query: '', favoritesOnly: false, selected: null, sort: 'featured' };
let favorites = new Set();
try { const saved = JSON.parse(localStorage.getItem('heraldry-favorites') || '[]'); if (Array.isArray(saved)) favorites = new Set(saved.filter(id => typeof id === 'string')); } catch { /* Storage may be disabled. Favorites still work for this visit. */ }
const backgrounds = {checker:['#eeeee6','conic-gradient(#dfe2d8 25%,transparent 0 50%,#dfe2d8 0 75%,transparent 0)'],light:['#ffffff','none'],dark:['#252a25','none'],red:['#872f36','none'],blue:['#2d5078','none']};
function make(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function announce(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(announce.timer); announce.timer = setTimeout(() => $('toast').classList.remove('visible'), 2400); }
function saveFavorite(id) {
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  let persisted = true;
  try { localStorage.setItem('heraldry-favorites', JSON.stringify([...favorites])); } catch { persisted = false; }
  updateFavorites();
  if (state.favoritesOnly) render();
  announce((favorites.has(id) ? 'Charge saved' : 'Charge removed from saved') + (persisted ? '' : ' for this visit'));
}
function updateFavorites() {
  $('favoriteCount').textContent = state.assets.filter(asset => favorites.has(asset.id)).length;
  document.querySelectorAll('[data-save]').forEach(button => {
    const saved = favorites.has(button.dataset.save);
    button.textContent = saved ? '♥' : '♡';
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${saved ? 'Unsave' : 'Save'} ${button.dataset.name}`);
  });
  if (state.selected) {
    const saved = favorites.has(state.selected.id);
    $('saveDetail').textContent = saved ? '♥ Saved to your charges' : '♡ Save this charge';
    $('saveDetail').setAttribute('aria-pressed', String(saved));
  }
}
function buildCategories() {
  $('categories').replaceChildren(...categoryNames.map(category => {
    const count = state.assets.filter(asset => category === 'All charges' || asset.category === category).length;
    const button = make('button', 'category', category);
    button.type = 'button'; button.dataset.category = category;
    button.append(make('span', '', count));
    button.onclick = () => { state.category = category; render(); };
    return button;
  }));
}
function render() {
  document.querySelectorAll('[data-category]').forEach(button => { const active = button.dataset.category === state.category; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
  $('favoritesOnly').setAttribute('aria-pressed',String(state.favoritesOnly));
  const terms = state.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const assets = state.assets.filter(asset =>
    (state.category === 'All charges' || asset.category === state.category) &&
    (!state.favoritesOnly || favorites.has(asset.id)) &&
    terms.every(term => `${asset.name} ${asset.category} ${asset.description} ${asset.tags.join(' ')}`.toLocaleLowerCase().includes(term)));
  if (state.sort !== 'featured') assets.sort((a,b) => (state.sort === 'az' ? 1 : -1) * a.name.localeCompare(b.name));
  $('resultCount').textContent = `${assets.length} of ${state.assets.length} charges${state.favoritesOnly ? ' · Saved' : ''}`;
  $('empty').hidden = assets.length > 0;
  $('grid').replaceChildren(...assets.map(asset => {
    const card = make('article','charge-card'); card.dataset.id = asset.id;
    const save = make('button','save'); save.type='button'; save.dataset.save=asset.id; save.dataset.name=asset.name; save.onclick=()=>saveFavorite(asset.id);
    const preview = make('button','art-button'); preview.type='button'; preview.setAttribute('aria-label',`Preview ${asset.name}`); preview.onclick=()=>showDetail(asset);
    const tile = make('span','art-tile');
    const img = new Image(); img.src=asset.png; img.alt=asset.name; img.loading='lazy'; img.decoding='async'; img.width=300; img.height=300;
    tile.append(img); preview.append(tile);
    const content = make('div','card-content'); const title=make('h3'); const titleButton=make('button','',asset.name); titleButton.type='button'; titleButton.onclick=()=>showDetail(asset); title.append(titleButton);
    const meta=make('div','card-meta'); meta.append(make('span','',asset.category),make('span','',asset.svg?'PNG + SVG':'PNG'));
    const bottom=make('div','card-bottom'); const download=make('a','','PNG ↓'); download.href=asset.png; download.download=asset.id+'.png'; download.setAttribute('aria-label',`Download ${asset.name} PNG`); bottom.append(download);
    if(asset.svg){const svg=make('a','','SVG ↓'); svg.href=asset.svg; svg.download=asset.id+'.svg'; svg.setAttribute('aria-label',`Download ${asset.name} SVG`); bottom.append(svg);}
    const more=make('button','more','Details ↗'); more.type='button'; more.setAttribute('aria-label',`Details for ${asset.name}`); more.onclick=()=>showDetail(asset); bottom.append(more);
    content.append(title,meta,bottom); card.append(save,preview,content); return card;
  }));
  updateFavorites();
}
function showDetail(asset) {
  state.selected=asset;
  $('detailImage').src=asset.png; $('detailImage').alt=asset.name;
  $('detailTitle').textContent=asset.name; $('detailCategory').textContent=asset.category;
  $('detailDescription').textContent=asset.description;
  $('detailSpec').textContent=`Transparent PNG · ${asset.width} × ${asset.height} px${asset.svg?' · Scalable SVG':''}`;
  $('downloadPng').href=asset.png; $('downloadPng').download=asset.id+'.png';
  $('downloadSvg').hidden=!asset.svg;
  if(asset.svg){$('downloadSvg').href=asset.svg; $('downloadSvg').download=asset.id+'.svg';}
  $('useDesigner').href=`designer.html?asset=${encodeURIComponent(asset.id)}`;
  $('detailCredit').textContent=asset.credit;
  $('detailLicense').replaceChildren();
  if(asset.licenseUrl){ const link=make('a','',asset.license); link.href=asset.licenseUrl; link.target='_blank'; link.rel='noopener noreferrer'; $('detailLicense').append(link); }
  else $('detailLicense').textContent=asset.license;
  $('detailChanges').textContent=asset.changes;
  $('detailSource').hidden=!asset.source; if(asset.source)$('detailSource').href=asset.source;
  updateFavorites();
  const url=new URL(location.href); url.searchParams.set('asset',asset.id); history.replaceState(null,'',url);
  if(!$('detail').open)$('detail').showModal();
}
$('search').addEventListener('input',event=>{state.query=event.target.value;render();});
$('sort').addEventListener('change',event=>{state.sort=event.target.value;render();});
$('favoritesOnly').onclick=()=>{state.favoritesOnly=!state.favoritesOnly;render();};
$('reset').onclick=()=>{state.category='All charges';state.query='';state.favoritesOnly=false;state.sort='featured';$('search').value='';$('sort').value='featured';render();};
$('saveDetail').onclick=()=>{if(state.selected)saveFavorite(state.selected.id);};
$('closeDetail').onclick=()=>$('detail').close();
$('detail').addEventListener('click',event=>{if(event.target===$('detail')){const r=$('detail').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('detail').close();}});
$('detail').addEventListener('close',()=>{state.selected=null;const url=new URL(location.href);url.searchParams.delete('asset');history.replaceState(null,'',url);});
document.querySelectorAll('[data-background]').forEach(button=>button.onclick=()=>{
  const [color,pattern]=backgrounds[button.dataset.background];
  document.documentElement.style.setProperty('--preview',color);document.documentElement.style.setProperty('--preview-pattern',pattern);
  document.querySelectorAll('[data-background]').forEach(other=>{const active=other===button;other.classList.toggle('selected',active);other.setAttribute('aria-pressed',String(active));});
});
(async()=>{
  try {
    const response=await fetch('catalog.json'); if(!response.ok)throw new Error('Catalog unavailable');
    state.assets=await response.json(); buildCategories(); render();
    const id=new URLSearchParams(location.search).get('asset'); const asset=state.assets.find(item=>item.id===id); if(asset)showDetail(asset);
  } catch(error) {
    $('resultCount').textContent='The catalog could not load. Refresh to try again.';
    $('grid').replaceChildren(make('p','','You can still download the complete collection using the button above.'));
    console.error(error);
  }
})();
