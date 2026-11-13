const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const [,, htmlPath, outDir, fps = '30'] = process.argv;
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(htmlPath)); await p.waitForTimeout(500);
  const end = await p.evaluate(() => window.END); const n = Math.round(end * +fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => window.render(t), i / +fps);
    await p.screenshot({ path: `${outDir}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 93 });
  }
  await b.close(); console.log('frames', n);
})();
