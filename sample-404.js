const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/en/does-not-exist', { waitUntil: 'load' });

  const result = await page.evaluate(async () => {
    const img = new Image();
    img.src = 'http://localhost:3000/images/404-hero.png';
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const px = (x, y) => {
      const d = ctx.getImageData(x, y, 1, 1).data;
      return `rgba(${d[0]},${d[1]},${d[2]},${d[3]})`;
    };
    return {
      size: [img.naturalWidth, img.naturalHeight],
      topLeft: px(2, 2),
      topRight: px(img.naturalWidth - 3, 2),
      bottomLeft: px(2, img.naturalHeight - 3),
      bottomRight: px(img.naturalWidth - 3, img.naturalHeight - 3),
      midLeft: px(2, Math.floor(img.naturalHeight / 2)),
    };
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
