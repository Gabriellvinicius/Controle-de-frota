import fs from 'fs';
import path from 'path';

const pagesDir = './src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
    if (file === 'Dashboard.jsx' || file === 'AccessControl.jsx') continue;

    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace hardcoded dark backgrounds
    const modified = content.replace(/(?<![:-])bg-\[\#1c2229\]/g, 'bg-white dark:bg-[#1c2229]');

    if (modified !== content) {
        fs.writeFileSync(filePath, modified, 'utf-8');
        console.log(`Fixed background in ${file}`);
    }
}
