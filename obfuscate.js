const fs = require('fs');
const path = require('path');

console.log('🚀 SIMPLE OBFUSCATION');
console.log('=====================');

// Get current directory
const currentDir = __dirname;
console.log(`Directory: ${currentDir}`);

// List files
console.log('\n📁 Files in directory:');
fs.readdirSync(currentDir).forEach(file => {
    console.log(`  - ${file}`);
});

// Check for bot.html
const botHtmlPath = path.join(currentDir, 'bot.html');
if (!fs.existsSync(botHtmlPath)) {
    console.error('\n❌ ERROR: bot.html not found!');
    console.log(`Looked in: ${botHtmlPath}`);
    console.log('\nMake sure:');
    console.log('1. This script is in same folder as bot.html');
    console.log('2. File is named exactly "bot.html" (case sensitive)');
    process.exit(1);
}

console.log(`\n✅ Found bot.html`);

// Read the file
const html = fs.readFileSync(botHtmlPath, 'utf8');
console.log(`📄 File size: ${html.length} characters`);

// Simple cleanup
console.log('\n🧹 Cleaning HTML...');
let cleaned = html
    .replace(/<script[^>]*src=["']#["'][^>]*><\/script>/gi, '')
    .replace(/<link[^>]*href=["']#["'][^>]*>/gi, '');

// Add resources
cleaned = cleaned.replace('</title>', `</title>
    <!-- Added by obfuscator -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>`);

// Save
const outputPath = path.join(currentDir, 'bot-obfuscated.html');
fs.writeFileSync(outputPath, cleaned, 'utf8');

console.log(`\n✅ SUCCESS! Created: ${outputPath}`);

// Verify
const stats = fs.statSync(outputPath);
console.log(`📏 Output size: ${stats.size} bytes`);

console.log('\n🎉 Done! Open bot-obfuscated.html in your browser.');