// Universal Entry Point for Root Deployments (Hostinger, Render, Railway, VPS)
const path = require('path');

const backendDir = path.join(__dirname, 'deePhysio-Backend (2)');
process.chdir(backendDir);
require(path.join(backendDir, 'src', 'server.js'));
