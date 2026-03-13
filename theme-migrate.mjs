import fs from 'fs';
import path from 'path';

const pagesDir = './src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

const rules = [
    { from: /(?<![:-])\btext-white\b/g, to: 'text-slate-900 dark:text-white' },
    { from: /(?<![:-])\btext-slate-400\b/g, to: 'text-slate-500 dark:text-slate-400' },
    { from: /(?<![:-])\bbg-\[\#1c2229\]\b/g, to: 'bg-white dark:bg-[#1c2229]' },
    { from: /(?<![:-])\bbg-\[\#161b22\]\b/g, to: 'bg-slate-50 dark:bg-[#161b22]' },
    { from: /(?<![:-])\bborder-white\/5\b/g, to: 'border-slate-200 dark:border-white/5' },
    { from: /(?<![:-])\bborder-white\/10\b/g, to: 'border-slate-200 dark:border-white/10' },
    { from: /(?<![:-])\bbg-white\/5\b/g, to: 'bg-slate-50 dark:bg-white/5' },
    { from: /(?<![:-])\bbg-white\/10\b/g, to: 'bg-slate-100 dark:bg-white/10' },
    { from: /(?<![:-])\bhover:bg-white\/5\b/g, to: 'hover:bg-slate-100 dark:hover:bg-white/5' },
    { from: /(?<![:-])\bhover:bg-white\/10\b/g, to: 'hover:bg-slate-200 dark:hover:bg-white/10' },
    { from: /(?<![:-])\btext-slate-600\b/g, to: 'text-slate-400 dark:text-slate-600' },
    { from: /(?<![:-])\btext-slate-300\b/g, to: 'text-slate-700 dark:text-slate-300' },
    { from: /(?<![:-])\bplaceholder:text-slate-600\b/g, to: 'placeholder:text-slate-400 dark:placeholder:text-slate-600' },
    { from: /(?<![:-])\bhover:text-white\b/g, to: 'hover:text-slate-900 dark:hover:text-white' },
    { from: /(?<![:-])\bbg-black\/70\b/g, to: 'bg-slate-900\/50 dark:bg-black\/70' }
];

for (const file of files) {
    if (file === 'Dashboard.jsx' || file === 'AccessControl.jsx') continue;

    const filePath = path.join(pagesDir, file);
    let ObjectContent = fs.readFileSync(filePath, 'utf-8');

    let modified = ObjectContent;
    for (const rule of rules) {
        modified = modified.replace(rule.from, rule.to);
    }

    // Fix buttons
    modified = modified.replace(/(bg-(?:sky|red|emerald|blue|green|rose|amber|yellow|indigo)-[456]00[^"']*?)text-slate-900 dark:text-white/g, '$1text-white');
    modified = modified.replace(/text-slate-900 dark:text-white([^"']*?bg-(?:sky|red|emerald|blue|green|rose|amber|yellow|indigo)-[456]00)/g, 'text-white$1');

    if (modified !== ObjectContent) {
        fs.writeFileSync(filePath, modified, 'utf-8');
        console.log(`Updated ${file}`);
    }
}
