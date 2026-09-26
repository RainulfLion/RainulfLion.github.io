const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const project=path.resolve(__dirname,'..'),out=path.join(__dirname,'artifacts');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.MAP_TEST_BROWSER?{executablePath:process.env.MAP_TEST_BROWSER}:{})});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(project,'index.html')).href);
  await page.waitForFunction(()=>artLoaded);
  await page.locator('#folderInput').setInputFiles(path.join(project,'newTiles/map-ready'));
  await page.waitForFunction(()=>artLoaded&&!artTainted&&CAL?.fromProfile);
  const result=await page.evaluate(()=>{
   const crest=(key,side)=>{
    const art=artFor(key,0),cv=document.createElement('canvas');cv.width=art.w;cv.height=art.h;
    const ctx=cv.getContext('2d');ctx.drawImage(art.img,0,0);
    const rgba=ctx.getImageData(0,0,cv.width,cv.height).data;
    const x0=side==='west'?10:art.w-100,mean=[];
    for(let y=510;y<650;y++){let v=0;for(let x=x0;x<x0+90;x++){const p=(y*art.w+x)*4;v+=rgba[p]+rgba[p+1]+rgba[p+2];}mean.push(v/270);}
    let best=0,drop=Infinity;
    for(let i=20;i<110;i++){let delta=0;for(let j=0;j<5;j++)delta+=mean[i+j]-mean[i-j-1];if(delta<drop){drop=delta;best=i;}}
    const sourceY=510+best,face=alignForFile(fileFor(key,0)).face;
    return {key,side,sourceY,mapY:(sourceY-face.top)/face.h*352};
   };
   const joins=[crest('westerosShadowTower','east'),crest('westerosWallEW','west'),crest('westerosWallEW','east'),crest('westerosCastleBlack','west'),crest('westerosCastleBlack','east'),crest('westerosEastwatch','west')];
   const cols=8,rows=3,N=cols*rows,idx=(c,r)=>r*cols+c,inB=(c,r)=>c>=0&&r>=0&&c<cols&&r<rows;
   Object.assign(W,{cols,rows,N,idx,inB,hasElev:false,land:new Uint8Array(N).fill(1),river:new Uint8Array(N),lake:new Uint8Array(N),down:new Int32Array(N).fill(-1),tile:Array(N).fill('snowField'),places:[],labels:[],decor:[],roads:[],bridges:[]});
   W.C={...cfg(),render:'art',tpx:300,sx:1,sy:1,bleed:0,ynudge:0,orient:'pointy',bitRot:0,bitRev:false,coast:false,rivers:false,roads:false,grid:false,labels:false,vignette:false,voidRing:false};TOPO='hex';ORIENT='pointy';
   for(let c=0;c<7;c++)W.tile[idx(c,1)]=c===0?'westerosShadowTower':c===2?'westerosCastleBlack':c===6?'westerosEastwatch':'westerosWallEW';
   for(let r=0;r<rows;r++){W.tile[idx(7,r)]='oceanCalm';W.land[idx(7,r)]=0;}
   invalidateIndexes();renderMap();
   return {joins,spread:Math.max(...joins.map(j=>j.mapY))-Math.min(...joins.map(j=>j.mapY)),image:mapCanvas.toDataURL('image/png')};
  });
  assert.ok(result.spread<=1,`Wall crest mismatch ${result.spread} pixels at 300px hex width`);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'wall-alignment.png'),Buffer.from(result.image.split(',')[1],'base64'));delete result.image;
  fs.writeFileSync(path.join(out,'wall-alignment.json'),JSON.stringify({passed:true,...result},null,2));
  console.log(JSON.stringify({passed:true,...result}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
