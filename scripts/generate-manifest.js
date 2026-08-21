/**
 * generate-manifest.js
 * Scansiona automaticamente la cartella viaggi/ (incluse tutte le eventuali sottocartelle)
 * e genera manifest.json in modo deterministico e ordinato.
 */

const fs = require('fs');
const path = require('path');

const VIAGGI_DIR = path.join(__dirname, '..', 'viaggi');
const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(__dirname, '..', 'manifest.json');
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function scanRecursively(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanRecursively(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VALID_EXTENSIONS.has(ext)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function generateManifest() {
  console.log('🔍 Avvio scansione cartella viaggi (con supporto ricorsivo per sottocartelle)...');
  
  if (!fs.existsSync(VIAGGI_DIR)) {
    console.warn('⚠️ Cartella "viaggi" non trovata. Creazione cartella vuota...');
    fs.mkdirSync(VIAGGI_DIR, { recursive: true });
  }

  const entries = fs.readdirSync(VIAGGI_DIR, { withFileTypes: true });
  const manifest = {};
  let totalTrips = 0;
  let totalPhotos = 0;

  // Filtra solo le cartelle dei viaggi principali
  const tripFolders = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort(naturalCompare);

  for (const tripId of tripFolders) {
    const tripPath = path.join(VIAGGI_DIR, tripId);
    
    // Scansiona ricorsivamente (es. viaggi/siviglia/Alcazar/...)
    const fullImagePaths = scanRecursively(tripPath);

    // Ordina i file in modo naturale
    fullImagePaths.sort((a, b) => naturalCompare(a, b));

    // Converti in percorsi relativi compatibili con il web ('/')
    manifest[tripId] = fullImagePaths.map(fullPath => {
      const rel = path.relative(ROOT_DIR, fullPath);
      return rel.split(path.sep).join('/');
    });
    
    totalTrips++;
    totalPhotos += manifest[tripId].length;
    console.log(`📁 Viaggio "${tripId}": ${manifest[tripId].length} fotografie trovate.`);
  }

  // Scrittura del file manifest.json formattato
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  
  console.log(`\n✨ manifest.json generato con successo!`);
  console.log(`📊 Totale viaggi: ${totalTrips} | Totale fotografie: ${totalPhotos}`);
  console.log(`📍 Percorso: ${OUTPUT_FILE}`);
}

generateManifest();
