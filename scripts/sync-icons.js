import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT_DIR, 'icons');
const EXTENSIONS_DIR = path.join(ROOT_DIR, 'extensions');

export function syncAllIcons() {
  console.log('\n🎨 ==============================================');
  console.log('   Syncing Icons from /icons to all Extensions   ');
  console.log('==================================================\n');

  if (!fs.existsSync(ICONS_DIR)) {
    console.error('❌ Root /icons folder does not exist.');
    return;
  }

  const iconSets = fs
    .readdirSync(ICONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let syncedCount = 0;

  for (const set of iconSets) {
    const sourceFolder = path.join(ICONS_DIR, set);
    const targetExtension = path.join(EXTENSIONS_DIR, set);

    if (!fs.existsSync(targetExtension)) {
      console.warn(`⚠️ Target extension folder 'extensions/${set}' not found, skipping.`);
      continue;
    }

    // Determine target public icons folder
    // docguard uses public/icons, dark-mode and recordflow use public/
    let targetIconsFolder = path.join(targetExtension, 'public');
    if (set === 'docguard') {
      targetIconsFolder = path.join(targetExtension, 'public', 'icons');
    }

    if (!fs.existsSync(targetIconsFolder)) {
      fs.mkdirSync(targetIconsFolder, { recursive: true });
    }

    const iconFiles = fs
      .readdirSync(sourceFolder)
      .filter((file) => file.endsWith('.png'));

    for (const iconFile of iconFiles) {
      const srcFile = path.join(sourceFolder, iconFile);
      const dstFile = path.join(targetIconsFolder, iconFile);
      fs.copyFileSync(srcFile, dstFile);
      syncedCount++;
    }

    console.log(`✅ Synced ${iconFiles.length} icons to extensions/${set}`);
  }

  console.log(`\n🎉 Total: ${syncedCount} icon files synced across all extensions.\n`);
}

// Run standalone if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncAllIcons();
}
