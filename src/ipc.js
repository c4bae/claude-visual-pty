import net from 'net';
import fs from 'fs';

const SOCKET_PATH = '/tmp/claude-overlay.sock';

export function createIPCServer(onStart, onStop) {
  // Clean up stale socket
  try { fs.unlinkSync(SOCKET_PATH); } catch {}

  const server = net.createServer((conn) => {
    conn.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg === 'start') onStart();
      if (msg === 'stop') onStop();
    });
    conn.on('error', () => {});
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      try { fs.unlinkSync(SOCKET_PATH); } catch {}
      server.listen(SOCKET_PATH);
    }
  });

  server.listen(SOCKET_PATH);

  return {
    socketPath: SOCKET_PATH,
    cleanup() {
      server.close();
      try { fs.unlinkSync(SOCKET_PATH); } catch {}
    }
  };
}

export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(SOCKET_PATH, () => {
      client.write(message);
      client.end();
      resolve();
    });
    client.on('error', (err) => {
      reject(err);
    });
  });
}
