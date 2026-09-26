const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const project=path.resolve(__dirname,'..'),root=path.dirname(project),out=path.join(__dirname,'artifacts');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.md':'text/plain'};
const server=http.createServer((req,res)=>{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname.endsWith('/'))pathname+='index.html';
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=process.env.MAP_TEST_URL||`http://127.0.0.1:${server.address().port}/Map-Generator/`;
  const browser=await chromium.launch({headless:true,...(process.env.MAP_TEST_BROWSER?{executablePath:process.env.MAP_TEST_BROWSER}:{})});
  const results=[];
  try{
    for(const size of [{width:1440,height:1000,mobile:false},{width:390,height:844,mobile:true},{width:320,height:640,mobile:true},{width:844,height:390,mobile:true}]){
      const context=await browser.newContext({viewport:{width:size.width,height:size.height},isMobile:size.mobile,hasTouch:size.mobile,deviceScaleFactor:size.mobile?2:1,acceptDownloads:true});
      const page=await context.newPage(),errors=[],failed=[];
      page.setDefaultTimeout(10000);
      page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
      await page.goto(url);await page.waitForFunction(()=>artLoaded&&Object.values(ART).filter(a=>a.ok).length===335,{},{timeout:30000});
      const boot=await page.evaluate(()=>({assets:Object.keys(ART).length,webp:USE_WEB_TILES,coasts:MASKS.get('hexCoast')?.size,missing:Object.keys(BASE).filter(k=>!fileFor(k,0)),scroll:document.documentElement.scrollWidth,width:innerWidth,stage:document.getElementById('stage').getBoundingClientRect().width}));
      assert.equal(boot.webp,true);assert.equal(boot.assets,335);assert.equal(boot.coasts,63);assert.deepEqual(boot.missing,[]);assert.ok(boot.scroll<=boot.width);
      assert.equal(await page.locator('.sw[data-key^="westeros"]').count(),26);
      assert.equal(await page.locator('#stampKind option[value^="westeros"]').count(),25);
      if(size.mobile){
        assert.equal(boot.stage,size.width);assert.equal(await page.evaluate(()=>PAINT.tool),'pan');
        await page.locator('#openControls').tap();await page.waitForFunction(()=>document.body.classList.contains('controls-open'));
        assert.equal(await page.locator('#side').getAttribute('aria-modal'),'true');
        assert.ok(await page.locator('#seed').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));
        await page.locator('#closeControls').tap();
        await page.locator('#mobileGenerate').tap();
      }else await page.locator('#gen').click();
      await page.waitForFunction(()=>mapCanvas&&W.cols);
      const generated=await page.evaluate(()=>{
        const heads=[];for(let i=0;i<W.N;i++)if(isRiverSource(i%W.cols,(i/W.cols)|0,i))heads.push(W.tile[i]);
        return {cols:W.cols,rows:W.rows,pixels:mapCanvas.width*mapCanvas.height,heads};
      });
      assert.ok(generated.heads.length>0&&generated.heads.every(t=>['mountain','mountainSnow','desertMountain'].includes(t)));
      if(!size.mobile){
        const castleNames=await page.evaluate(()=>{
          WESTEROS_TILES.forEach((t,j)=>{const i=W.idx(3+(j%8)*2,3+Math.floor(j/8)*2);W.tile[i]=t.key;W.land[i]=1;});
          invalidateIndexes();renderMap();
          return WESTEROS_TILES.filter(t=>t.isPlace).every(t=>placeName(()=>.1,t.key)===t.name);
        });
        assert.equal(castleNames,true);
      }
      if(size.mobile){
        assert.equal(generated.cols,40);assert.equal(generated.rows,30);assert.ok(generated.pixels<8e6);
        const cdp=await context.newCDPSession(page),box=await page.locator('#view').boundingBox();
        const cx=Math.round(box.x+box.width/2),cy=Math.round(box.y+box.height/2);
        const touch=async(type,points)=>{
          await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y],i)=>({x,y,id:i+1,radiusX:1,radiusY:1,force:1}))});
          // Give the browser a real gesture duration, rather than a zero-time fling.
          await page.waitForTimeout(100);
        };
        const before=await page.evaluate(()=>({x:VX,y:VY,tiles:W.tile.join('|')}));
        await touch('touchStart',[[cx,cy]]);await touch('touchMove',[[cx+35,cy+20]]);await touch('touchEnd',[]);
        const after=await page.evaluate(()=>({x:VX,y:VY,tiles:W.tile.join('|')}));
        assert.ok(after.x!==before.x||after.y!==before.y);assert.equal(after.tiles,before.tiles);
        await page.locator('#openControls').tap();
        await page.waitForFunction(()=>document.body.classList.contains('controls-open'));
        await page.screenshot({path:path.join(out,`controls-${size.width}x${size.height}.png`),animations:'disabled'});
        const drawer=await page.locator('#side').evaluate(el=>({left:el.scrollLeft,content:el.scrollWidth,width:el.clientWidth,x:el.getBoundingClientRect().x}));
        assert.equal(drawer.left,0);assert.equal(drawer.x,0);assert.ok(drawer.content<=drawer.width,JSON.stringify(drawer));
        assert.equal(await page.evaluate(()=>document.body.classList.contains('controls-open')),true,'Controls should reopen after touch panning');
        await page.locator('.tool[data-tool="brush"]').tap();
        await page.locator('.sw[data-key="desertDunes"]').tap();
        await page.locator('#closeControls').tap();
        const beforePinch=await page.evaluate(()=>({z:VZ,tiles:W.tile.join('|')}));
        await touch('touchStart',[[cx-30,cy],[cx+30,cy]]);await touch('touchMove',[[cx-65,cy-5],[cx+65,cy+5]]);await touch('touchEnd',[]);
        const afterPinch=await page.evaluate(()=>({z:VZ,tiles:W.tile.join('|'),active:PAINT.active}));
        assert.ok(afterPinch.z>beforePinch.z*1.5);assert.equal(afterPinch.tiles,beforePinch.tiles);assert.equal(afterPinch.active,false);
        await page.locator('#viewFit').tap();
        const point=await page.evaluate(()=>{
          const c=(W.cols/2)|0,r=(W.rows/2)|0,i=W.idx(c,r),[x,y]=cellXY(c,r,CURG,W.C),rect=view.getBoundingClientRect();
          return {i,x:rect.x+VX+(x+OX+CURG.drawW/2)*VZ,y:rect.y+VY+(y+OY+CURG.faceH/2)*VZ};
        });
        await page.touchscreen.tap(point.x,point.y);assert.equal(await page.evaluate(i=>W.tile[i],point.i),'desertDunes');
        await page.locator('#openControls').tap();await page.keyboard.press('Escape');
        assert.equal(await page.locator('#openControls').getAttribute('aria-expanded'),'false');
      }
      const downloading=page.waitForEvent('download');await page.locator(size.mobile?'#mobileExport':'#export').click();
      const download=await downloading,file=path.join(out,`map-${size.width}x${size.height}.png`);await download.saveAs(file);
      assert.equal(fs.readFileSync(file).subarray(1,4).toString(),'PNG');
      await page.screenshot({path:path.join(out,`screen-${size.width}x${size.height}.png`)});
      assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
      results.push({viewport:`${size.width}x${size.height}`,mobile:size.mobile,assets:boot.assets,exportBytes:fs.statSync(file).size,...generated,passed:true});
      if(size.width===320){
        await page.goto(new URL('tiles.html',url).href);
        assert.equal(await page.locator('#gallery article').count(),335);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        await page.locator('#group').selectOption('coast');
        assert.equal(await page.locator('#gallery article').count(),63);
        await page.locator('#search').fill('no-such-terrain');assert.equal(await page.locator('#empty').isVisible(),true);
        await page.locator('#search').fill('');
        await page.waitForFunction(()=>document.querySelector('#gallery img').naturalWidth===300);
        const png=page.waitForEvent('download');await page.locator('#gallery a').first().click();
        const tile=await png;await tile.saveAs(path.join(out,'gallery-tile.png'));
        assert.equal(fs.readFileSync(path.join(out,'gallery-tile.png')).subarray(1,4).toString(),'PNG');
        await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'gallery-phone.png'),animations:'disabled'});
        assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
        await page.goto(new URL('newTiles/westeros/preview.html',url).href);
        assert.equal(await page.locator('#grid article').count(),26);
        await page.locator('#grid img').evaluateAll(imgs=>Promise.all(imgs.map(im=>{im.loading='eager';return im.decode()})));
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        await page.locator('#search').fill('Shadow Tower');assert.equal(await page.locator('#grid article:visible').count(),1);
        await page.getByRole('button',{name:'Enlarge Shadow Tower',exact:true}).click();
        assert.ok(await page.locator('#viewer').isVisible());await page.locator('#close').click();
        const castleDownload=page.waitForEvent('download');await page.locator('#grid article:visible a').click();
        const castleFile=path.join(out,'shadow-tower.png');await (await castleDownload).saveAs(castleFile);
        const pngBytes=fs.readFileSync(castleFile);assert.equal(pngBytes.subarray(1,4).toString(),'PNG');
        assert.equal(pngBytes.readUInt32BE(16),1024);assert.equal(pngBytes.readUInt32BE(20),1536);
        await page.locator('#search').fill('');await page.screenshot({path:path.join(out,'westeros-phone.png')});
        assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
      }
      await context.close();
    }
    fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify({passed:true,url,results},null,2));console.log(JSON.stringify({passed:true,results}));
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
