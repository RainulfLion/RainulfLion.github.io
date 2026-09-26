'use strict';
// This script intentionally shares the supplied designer's state and layer helpers.
(() => {
  let assets = [];
  let loading = false;
  let adding = false;
  let assetRequest;
  const status = document.getElementById('catalogStatus');
  const picker = document.getElementById('catalogPicker');
  const query = document.getElementById('pickerSearch');
  const category = document.getElementById('pickerCategory');
  const grid = document.getElementById('pickerGrid');
  const count = document.getElementById('pickerCount');
  const creditText = asset => `${asset.name}\n${asset.credit}\n${asset.source ? 'Source: '+asset.source+'\n' : ''}License: ${asset.license}${asset.licenseUrl ? ' — '+asset.licenseUrl : ''}\n${asset.changes}`;
  function renderPicker() {
    const terms = query.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches = assets.filter(asset => (category.value === 'All charges' || category.value === asset.category) && terms.every(term => `${asset.name} ${asset.tags.join(' ')}`.toLocaleLowerCase().includes(term)));
    count.textContent = loading ? 'Loading catalog…' : `${matches.length} charges · Select one to add it`;
    grid.replaceChildren(...matches.map(asset => {
      const button = document.createElement('button');button.className='picker-item';button.type='button';button.disabled=adding;
      button.setAttribute('aria-label',`Add ${asset.name}`);
      const img = new Image(); img.src=asset.png;img.alt='';img.loading='lazy';
      const label=document.createElement('span');label.textContent=asset.name;button.append(img,label);
      button.onclick=()=>addAsset(asset);return button;
    }));
    if(!matches.length && !loading)count.textContent='No matching charges. Try another search or category.';
  }
  async function loadAssets() {
    if(assetRequest)return assetRequest;
    loading=true;
    assetRequest=(async()=>{
      const response=await fetch('catalog.json');if(!response.ok)throw Error('Catalog unavailable');
      assets=await response.json();return assets;
    })();
    try {return await assetRequest;} catch(error){assetRequest=null;throw error;} finally{loading=false;}
  }
  async function addAsset(asset) {
    if(adding)return;
    adding=true;renderPicker();status.textContent=`Adding ${asset.name}…`;
    try {
      const response=await fetch(asset.svg || asset.png);if(!response.ok)throw Error('Image unavailable');
      const blob=await response.blob();
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
      const img=new Image();img.src=data;await img.decode();
      const layer=addImageLayer(data,asset.name,img.naturalWidth,img.naturalHeight);
      layer.catalogCredit={id:asset.id,text:creditText(asset)};
      status.textContent=`${asset.name} added to your shield.`;
      if(picker.open)picker.close();
      const url=new URL(location.href);url.searchParams.delete('asset');history.replaceState(null,'',url);
    } catch(error) {status.textContent='The artwork could not load. Please try again.';console.error(error);}
    finally{adding=false;renderPicker();}
  }
  document.getElementById('browseCatalog').onclick=async()=>{
    picker.showModal();
    if(document.body.classList.contains('phone-layout'))document.getElementById('closePicker').focus();
    else query.focus();
    renderPicker();
    try{await loadAssets();renderPicker();}catch(error){count.textContent='The catalog could not load. Close it and try again.';console.error(error);}
  };
  document.getElementById('closePicker').onclick=()=>picker.close();
  query.oninput=renderPicker;category.onchange=renderPicker;
  document.getElementById('saveCreditsBtn').onclick=()=>{
    const credits=[...new Set(state.layers.filter(layer=>layer.catalogCredit).map(layer=>layer.catalogCredit.text))];
    const text='HERALDRY DESIGN — ARTWORK CREDITS\n\n'+(credits.length?credits.join('\n\n'):'No catalog artwork in this design. User-uploaded artwork retains its own terms.')+'\n';
    download(new Blob([text],{type:'text/plain;charset=utf-8'}),'coat-of-arms-credits.txt');
  };
  const requested=new URLSearchParams(location.search).get('asset');
  if(requested)(async()=>{
    try{await loadAssets();const asset=assets.find(item=>item.id===requested);if(asset)await addAsset(asset);else status.textContent='That charge is not in the catalog. Use Browse to choose another.';}
    catch(error){status.textContent='The catalog could not load. Use Browse to try again.';console.error(error);}
  })();
})();
