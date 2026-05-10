const fs = require('fs');

const inputFile = 'C:\\Users\\ECC\\Downloads\\graduation_project (1).sql';
const outputFile = 'C:\\Users\\ECC\\Downloads\\fixed_graduation_project.sql';

try {
    let content = fs.readFileSync(inputFile, 'utf8');
    
    // 1. Settings
    let finalContent = "SET FOREIGN_KEY_CHECKS = 0;\nSET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n";
    
    // 2. DROP TABLE
    content = content.replace(/CREATE TABLE `([^`]+)`/g, 'DROP TABLE IF EXISTS `$1`;\nCREATE TABLE `$1`');
    
    // 3. In-line PK
    content = content.replace(/(`id` [^,]+ NOT NULL)/g, '$1 PRIMARY KEY');
    
    // 4. Remove ALL problematic ALTER TABLE statements for PKs
    // Match the whole block if it's just adding a primary key
    content = content.replace(/ALTER TABLE `([^`]+)`\s+ADD PRIMARY KEY \(`[^`]+`\);/g, '-- PK block removed');
    
    // Match PK inside a multi-line ALTER TABLE
    content = content.replace(/ADD PRIMARY KEY \(`[^`]+`\),/g, '-- PK line removed');
    
    // 5. Clean up any empty ALTER TABLE statements that might have been left
    content = content.replace(/ALTER TABLE `([^`]+)`\s+;/g, '-- Empty ALTER removed');

    finalContent += content + "\nSET FOREIGN_KEY_CHECKS = 1;";
    
    fs.writeFileSync(outputFile, finalContent, 'utf8');
    console.log(`Fixed SQL file saved to ${outputFile}`);
} catch (err) {
    console.error(err);
}
