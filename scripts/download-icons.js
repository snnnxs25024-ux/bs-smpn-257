import fs from 'fs';
import https from 'https';
import path from 'path';

const iconUrl = 'https://i.imgur.com/2XP7suZ.png';
const publicDir = path.resolve('./public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  try {
    console.log('Downloading PWA icons...');
    await download(iconUrl, path.join(publicDir, 'pwa-192x192.png'));
    await download(iconUrl, path.join(publicDir, 'pwa-512x512.png'));
    await download(iconUrl, path.join(publicDir, 'apple-touch-icon.png'));
    await download(iconUrl, path.join(publicDir, 'favicon.png'));
    console.log('PWA icons downloaded successfully!');
  } catch (error) {
    console.error('Error downloading PWA icons:', error);
  }
}

main();
