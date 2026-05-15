const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('build')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
};

const files = walk('c:/Users/ECC/Downloads/Graduation-project--main/src').concat([
    'c:/Users/ECC/Downloads/Graduation-project--main/server.js'
]);

files.forEach(file => {
    let raw = fs.readFileSync(file);
    let content = raw.toString('utf8');
    
    // Target common multi-byte encoding artifacts
    // The "diamond question mark" is often U+FFFD
    // But sometimes it's caused by double-encoding or bad UTF-8 sequences.
    
    const originalContent = content;
    
    // Replace the specific problematic sequence that looks like  in some viewers or  in others
    content = content.replace(/\ufffd/g, '');
    content = content.replace(/\u00c2/g, ''); 
    content = content.replace(/\u00A3/g, 'JOD'); // In case some JOD are still there as hex
    
    // Some files might be encoded in win1252 but read as utf8
    // If we see JOD, it's definitely an artifact
    content = content.replace(/JOD/g, 'JOD');
    content = content.replace(/JOD/g, 'JOD');
    content = content.replace(/JOD/g, 'JOD');

    if (content !== originalContent) {
        console.log(`Cleaned: ${file}`);
        fs.writeFileSync(file, content, 'utf8');
    }
});
