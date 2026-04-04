/**
 * Downloads face-api.js model weights into public/models/
 * Run from the frontend/ directory: node scripts/download-models.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models');

const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',
];

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log(`✓ Downloaded: ${path.basename(dest)}`); resolve(); });
    }).on('error', (e) => { fs.unlink(dest, () => {}); reject(e); });
  });
}

(async () => {
  console.log('Downloading face-api.js models...\n');
  for (const f of FILES) {
    await download(`${BASE_URL}/${f}`, path.join(OUTPUT_DIR, f));
  }
  console.log('\n✅ All models downloaded to public/models/');
})();
