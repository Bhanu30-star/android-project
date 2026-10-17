const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9333;

  console.log('Launching headless browser...');
  const proc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--hide-scrollbars',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\hp\\.gemini\\antigravity\\brain\\2a7c6d22-7506-4748-be24-17c5802d77c0\\scratch\\edge_profile',
    'about:blank',
  ]);

  proc.on('error', (err) => console.error('Proc error:', err));

  // Wait for debug port
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) break;
    } catch {}
  }

  const verRes = await fetch(`http://127.0.0.1:${port}/json/version`);
  const verData = await verRes.json();
  const browserWs = verData.webSocketDebuggerUrl;

  console.log('Connected to browser:', browserWs);

  const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?http://localhost:8088/dashboard`, {
    method: 'PUT',
  });
  const targetData = await newTargetRes.json();
  const pageWs = targetData.webSocketDebuggerUrl;

  const ws = new WebSocket(pageWs);

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

  // Wait for React to load and render
  console.log('Waiting for page render...');
  await new Promise((r) => setTimeout(r, 4000));

  async function snap(w, h, filename) {
    console.log(`Setting device metrics override: ${w}x${h}`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await new Promise((r) => setTimeout(r, 1000));

    console.log(`Capturing screenshot for ${filename}...`);
    const result = await send('Page.captureScreenshot', {
      format: 'png',
    });

    const buf = Buffer.from(result.data, 'base64');
    fs.writeFileSync(filename, buf);
    console.log(`Saved ${filename} (${buf.length} bytes)`);
  }

  const outDir = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\2a7c6d22-7506-4748-be24-17c5802d77c0\\screenshots';
  await snap(360, 800, `${outDir}\\android_360x800.png`);
  await snap(390, 844, `${outDir}\\iphone_390x844.png`);

  ws.close();
  proc.kill();
  console.log('Done!');
}

main().catch(console.error);
