import fs from 'fs';
import path from 'path';

const searchDirs = [
  path.join(process.cwd(), 'src', 'pages'),
  path.join(process.cwd(), 'src', 'components')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern 1: <Compass ... /> NextraPath
  const pattern1 = /<Compass\s+className="([^"]+)"\s*\/>\s*(?:NextraPath|\n\s*NextraPath)/g;
  let matches = 0;
  
  content = content.replace(pattern1, (match, classNames) => {
    matches++;
    // filter out text colors from the image
    const cleanedClasses = classNames.replace(/text-[a-z]+-\d+/g, '').trim();
    return `<img src="/logo.png" alt="NextraPath Logo" className="${cleanedClasses} object-contain drop-shadow-sm" /> NextraPath`;
  });

  // Pattern 2: the big one in Home.jsx footer if it exists, or just the WelcomePopup ones if they are branded
  // Actually, WelcomePopup uses Compass as a giant decor element. The user might want the new logo there too!
  const pattern2 = /<Compass\s+className="h-44 w-44([^"]*)"\s*\/>/g;
  content = content.replace(pattern2, (match, classes) => {
    matches++;
    return `<img src="/logo.png" alt="NextraPath" className="h-44 w-44 object-contain drop-shadow-lg opacity-90" />`;
  });

  if (matches > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${matches} logos in ${filePath}`);
  }
}

searchDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.endsWith('.jsx')) {
      processFile(path.join(dir, file));
    }
  });
});
