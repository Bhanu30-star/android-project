const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9666;

  console.log('Starting headless browser...');
  const proc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--hide-scrollbars',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\hp\\.gemini\\antigravity\\brain\\2a7c6d22-7506-4748-be24-17c5802d77c0\\scratch\\edge_profile_drawer',
    'about:blank',
  ]);

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) break;
    } catch {}
  }

  const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?http://localhost:8088/dashboard`, {
    method: 'PUT',
  });
  const targetData = await newTargetRes.json();
  const ws = new WebSocket(targetData.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('DOM.enable');

  console.log('Waiting for page render...');
  await new Promise((r) => setTimeout(r, 4000));

  const outDir = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\2a7c6d22-7506-4748-be24-17c5802d77c0\\screenshots';

  async function snap(filename) {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(result.data, 'base64');
    fs.writeFileSync(filename, buf);
    console.log(`Saved ${filename} (${buf.length} bytes)`);
  }

  // 1. Android 360x800 - Open Drawer
  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // Click hamburger button
  console.log('Clicking hamburger button...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('[aria-label="Open navigation menu"]');
        if (btn) btn.click();
        return !!btn;
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 800));
  await snap(`${outDir}\\drawer_360x800.png`);

  // Scroll down drawer menu to see DSR and lower items
  console.log('Scrolling drawer...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const spans = Array.from(document.querySelectorAll('span, div'));
        const target = spans.find(s => s.textContent === 'STOCK REQUEST');
        if (target) {
          let p = target.parentElement;
          while (p) {
            if (p.scrollHeight > p.clientHeight + 50) {
              p.scrollTop = 350;
              return true;
            }
            p = p.parentElement;
          }
        }
        return false;
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 600));
  await snap(`${outDir}\\drawer_scroll_360x800.png`);

  // 2. iPhone 390x844
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // Reset scroll
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const spans = Array.from(document.querySelectorAll('span, div'));
        const target = spans.find(s => s.textContent === 'STOCK REQUEST');
        if (target) {
          let p = target.parentElement;
          while (p) {
            if (p.scrollHeight > p.clientHeight + 50) {
              p.scrollTop = 0;
              return true;
            }
            p = p.parentElement;
          }
        }
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 600));
  await snap(`${outDir}\\drawer_390x844.png`);

  // Scroll to bottom on iPhone
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const spans = Array.from(document.querySelectorAll('span, div'));
        const target = spans.find(s => s.textContent === 'STOCK REQUEST');
        if (target) {
          let p = target.parentElement;
          while (p) {
            if (p.scrollHeight > p.clientHeight + 50) {
              p.scrollTop = 450;
              return true;
            }
            p = p.parentElement;
          }
        }
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 600));
  await snap(`${outDir}\\drawer_footer_390x844.png`);

  ws.close();
  proc.kill();
  console.log('Drawer screenshots captured successfully!');
}

main().catch(console.error);
