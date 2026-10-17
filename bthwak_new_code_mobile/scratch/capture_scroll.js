const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9444;

  const proc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--hide-scrollbars',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\hp\\.gemini\\antigravity\\brain\\2a7c6d22-7506-4748-be24-17c5802d77c0\\scratch\\edge_profile_scroll',
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

  await new Promise((r) => setTimeout(r, 4000));

  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
  });

  const outDir = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\2a7c6d22-7506-4748-be24-17c5802d77c0\\screenshots';

  async function snap(filename) {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(result.data, 'base64');
    fs.writeFileSync(filename, buf);
    console.log(`Saved ${filename}`);
  }

  // Scroll down 450px
  await send('Runtime.evaluate', {
    expression: 'window.scrollTo(0, 480); document.querySelector("div[style*=\'overflow\']")?.scrollTo?.(0, 480);',
  });
  await new Promise((r) => setTimeout(r, 800));
  await snap(`${outDir}\\android_mid_360x800.png`);

  // Scroll down 1000px
  await send('Runtime.evaluate', {
    expression: 'window.scrollTo(0, 1100); document.querySelector("div[style*=\'overflow\']")?.scrollTo?.(0, 1100);',
  });
  await new Promise((r) => setTimeout(r, 800));
  await snap(`${outDir}\\android_lower_360x800.png`);

  ws.close();
  proc.kill();
}

main().catch(console.error);
