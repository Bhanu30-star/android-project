const { spawn } = require('child_process');
const fs = require('fs');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9777;

  console.log('Starting headless browser for profile capture...');
  const proc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--hide-scrollbars',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\hp\\.gemini\\antigravity\\brain\\2a7c6d22-7506-4748-be24-17c5802d77c0\\scratch\\edge_profile_profile',
    'about:blank',
  ]);

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) break;
    } catch {}
  }

  const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?http://localhost:8088/profile`, {
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

  console.log('Waiting for profile page render...');
  await new Promise((r) => setTimeout(r, 4000));

  const outDir = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\2a7c6d22-7506-4748-be24-17c5802d77c0\\screenshots';

  async function snap(filename) {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(result.data, 'base64');
    fs.writeFileSync(filename, buf);
    console.log(`Saved ${filename} (${buf.length} bytes)`);
  }

  // 1. Android 360x800 - Top of Profile
  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 500));
  await snap(`${outDir}\\profile_android_top_360x800.png`);

  // Scroll to Middle
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const scrollable = Array.from(document.querySelectorAll('div')).find(
          d => d.scrollHeight > d.clientHeight + 100
        );
        if (scrollable) scrollable.scrollTop = 450;
        return !!scrollable;
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 600));
  await snap(`${outDir}\\profile_android_mid_360x800.png`);

  // Scroll to Bottom (Uploads & Save button)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const scrollable = Array.from(document.querySelectorAll('div')).find(
          d => d.scrollHeight > d.clientHeight + 100
        );
        if (scrollable) scrollable.scrollTop = 1800;
        return !!scrollable;
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 600));
  await snap(`${outDir}\\profile_android_bottom_360x800.png`);

  // 2. iPhone 390x844 - Top & Middle
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
        const scrollable = Array.from(document.querySelectorAll('div')).find(
          d => d.scrollHeight > d.clientHeight + 100
        );
        if (scrollable) scrollable.scrollTop = 0;
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 600));
  await snap(`${outDir}\\profile_iphone_top_390x844.png`);

  // iPhone Bottom (Portal logins & Uploads)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const scrollable = Array.from(document.querySelectorAll('div')).find(
          d => d.scrollHeight > d.clientHeight + 100
        );
        if (scrollable) scrollable.scrollTop = 1800;
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 600));
  await snap(`${outDir}\\profile_iphone_bottom_390x844.png`);

  // 3. ERROR & DIRTY STATE VERIFICATION
  // Reset scroll and trigger validation errors on Firm Name, Mobile, GSTIN, PAN
  console.log('Triggering validation errors for error-state screenshot...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const scrollable = Array.from(document.querySelectorAll('div')).find(
          d => d.scrollHeight > d.clientHeight + 100
        );
        if (scrollable) scrollable.scrollTop = 260;

        const setReactValue = (input, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) {
            setter.call(input, val);
          } else {
            input.value = val;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.blur();
        };

        const inputs = Array.from(document.querySelectorAll('input'));
        
        // 1. Firm name empty
        const firmInput = inputs.find(i => i.value === 'Bhanu' || i.placeholder.includes('firm name'));
        if (firmInput) {
          firmInput.focus();
          setReactValue(firmInput, '');
        }

        // 2. Invalid Mobile
        const mobileInput = inputs.find(i => i.value.includes('772699') || i.placeholder.includes('mobile'));
        if (mobileInput) {
          mobileInput.focus();
          setReactValue(mobileInput, '12345');
        }

        // 3. Invalid GSTIN
        const gstinInput = inputs.find(i => i.placeholder.includes('GSTIN') || i.value.includes('36AA'));
        if (gstinInput) {
          gstinInput.focus();
          setReactValue(gstinInput, '36ABC');
        }

        // 4. Invalid PAN
        const panInput = inputs.find(i => i.placeholder.includes('PAN') || i.value.includes('ILOP'));
        if (panInput) {
          panInput.focus();
          setReactValue(panInput, 'ILOP1');
        }

        return true;
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1000));
  await snap(`${outDir}\\profile_error_state_390x844.png`);

  ws.close();
  proc.kill();
  console.log('All profile screenshots successfully captured!');
}

main().catch(console.error);
