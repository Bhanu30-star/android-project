const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function capture() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9222;

  // Start Edge with remote debugging
  const proc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--hide-scrollbars',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank',
  ]);

  // Wait for debug port to be open
  await new Promise((r) => setTimeout(r, 1500));

  function getWsUrl() {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.webSocketDebuggerUrl);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  const wsUrl = await getWsUrl();
  console.log('Debugger URL:', wsUrl);

  const WebSocket = require('ws');
  // If ws is not globally available in node, check if we can require it from project
  // If not, we'll use CDP HTTP endpoint
}

capture().catch(console.error);
