const { spawn } = require('child_process');
const path = require('path');

console.log("Starting server...");
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Keep it running for 5 seconds then kill it
setTimeout(() => {
  console.log("Stopping server test...");
  server.kill();
}, 5000);
