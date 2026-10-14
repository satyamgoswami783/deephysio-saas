// Universal Entry Point for Root Deployments (Hostinger, Render, Railway, VPS)
const path = require('path');
const fs = require('fs');

// Global error handlers to prevent silent crashes causing 502 Bad Gateway
process.on('uncaughtException', (err) => {
  console.error('❌ [CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ [CRITICAL] Unhandled Rejection:', reason);
});

// Configure backend directory paths
const backendDir = path.join(__dirname, 'deePhysio-Backend (2)');
const rootModules = path.join(__dirname, 'node_modules');
const backendModules = path.join(backendDir, 'node_modules');

// Ensure module resolution finds modules in both root and backend directory
const nodePaths = [rootModules, backendModules, process.env.NODE_PATH].filter(Boolean);
process.env.NODE_PATH = nodePaths.join(path.delimiter);
if (require('module').Module && require('module').Module._initPaths) {
  require('module').Module._initPaths();
}

// Auto-load .env if available without external dependency
const loadEnvFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (_) {}
};

loadEnvFile(path.resolve(__dirname, '.env'));
loadEnvFile(path.resolve(backendDir, '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

// Check and auto-generate Prisma client if needed
try {
  require('@prisma/client');
} catch (e) {
  console.log('🔄 Prisma client not detected. Generating now...');
  try {
    const { execSync } = require('child_process');
    const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
    execSync(`npx prisma generate --schema="${schemaPath}"`, { stdio: 'inherit' });
  } catch (genErr) {
    console.error('⚠️ Could not auto-generate prisma client:', genErr.message);
  }
}

// Switch working directory to backend so all internal relative paths succeed
if (fs.existsSync(backendDir)) {
  process.chdir(backendDir);
}

require(path.join(backendDir, 'src', 'server.js'));
