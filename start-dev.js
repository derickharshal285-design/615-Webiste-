import { spawn } from 'child_process';

const startProcess = (command, args, cwd, label) => {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'cmd.exe' : command;
  const cmdArgs = isWindows ? ['/c', command, ...args] : args;

  console.log(`[System] Starting ${label} process...`);
  const proc = spawn(cmd, cmdArgs, { cwd, stdio: 'inherit' });
  
  proc.on('close', (code) => {
    console.log(`[${label}] Process exited with code ${code}`);
  });
  
  return proc;
};

console.log("=========================================");
console.log("   Initializing Club 615 Dev Grid...     ");
console.log("=========================================");

// Start frontend (Vite)
startProcess('npm', ['run', 'dev'], './frontend', 'Frontend');

// Start backend (Express Node server)
startProcess('node', ['server.js'], './backend', 'Backend');
