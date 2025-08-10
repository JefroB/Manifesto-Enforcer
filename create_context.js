const fs = require('fs');
const path = require('path');

const outputFile = 'project_context.txt';
const excludeDirs = new Set(['node_modules', '.git', 'out', 'dist']);

let outputContent = "Project Context: All TypeScript Files\n";

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!excludeDirs.has(file)) {
                walk(fullPath);
            }
        } else if (path.extname(file) === '.ts') { // Only include .ts files
            const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
            console.log(`Adding: ${relativePath}`);
            outputContent += `\n==================== FILE: ${relativePath} ====================\n`;
            outputContent += fs.readFileSync(fullPath, 'utf-8');
        }
    }
}

try {
    walk(process.cwd());
    fs.writeFileSync(outputFile, outputContent);
    console.log(`\n✅ project_context.txt has been successfully created with only TypeScript files!`);
} catch (error) {
    console.error(`Error creating context file: ${error.message}`);
}