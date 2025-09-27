const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

contextBridge.exposeInMainWorld('liveboardAPI', {
  autosavePath: () => path.join(os.homedir(), '.liveboard', 'autosave.json'),
  writeFile: (filePath, data) => fs.writeFileSync(filePath, data, 'utf-8'),
  readFile: (filePath) => fs.readFileSync(filePath, 'utf-8'),
  fileExists: (filePath) => fs.existsSync(filePath),
  mkdir: (dirPath) => fs.mkdirSync(dirPath, { recursive: true }),
  dirname: (filePath) => path.dirname(filePath),
});