#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to process
const srcDir = path.join(__dirname, '..', 'src');

function removeConsoleLogs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Remove console.log, console.warn, console.error, console.info statements
  // But keep console.error in catch blocks for production error tracking
  const cleanedContent = content
    // Remove standalone console statements
    .replace(/^\s*console\.(log|warn|info)\([^;]*\);?\s*$/gm, '')
    // Remove console statements in the middle of lines
    .replace(/console\.(log|warn|info)\([^;]*\);\s*/g, '')
    // Keep console.error in catch blocks but make them conditional
    .replace(/console\.error\(/g, 'process.env.NODE_ENV !== "production" && console.error(')
    // Remove empty lines left behind
    .replace(/\n\s*\n\s*\n/g, '\n\n');
  
  if (content !== cleanedContent) {
    fs.writeFileSync(filePath, cleanedContent, 'utf8');
    console.log(`Cleaned: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      removeConsoleLogs(filePath);
    }
  });
}

console.log('Removing console logs from source files...');
processDirectory(srcDir);
console.log('Console logs cleanup complete!');
