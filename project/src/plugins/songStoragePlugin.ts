import { Plugin } from 'vite';
import { SongMetadata } from '../utils/songStorage';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

interface StorageOptions {
  songsDir?: string;
  metadataFile?: string;
}

export function songStoragePlugin(options: StorageOptions = {}): Plugin {
  const songsDir = path.join(process.cwd(), 'public', 'songs');
  const metadataFile = path.join(songsDir, 'songs.json');

  return {
    name: 'vite:song-storage',
    configureServer(server) {
      // Ensure storage directories exist
      fs.mkdir(songsDir, { recursive: true }).catch(console.error);

      // API endpoints
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/songs')) {
          return next();
        }

        try {
          // Handle uploads
          if (req.method === 'POST' && req.url === '/api/songs/upload') {
            const chunks: Buffer[] = [];
            req.on('data', chunk => chunks.push(chunk));
            await new Promise((resolve, reject) => {
              req.on('end', resolve);
              req.on('error', reject);
            });

            const formData = Buffer.concat(chunks);
            // Process formData and save file...

            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
            return;
          }

          // Get song metadata
          if (req.method === 'GET' && req.url === '/api/songs/metadata') {
            const metadata = await fs.readFile(metadataFile, 'utf-8')
              .then(data => JSON.parse(data))
              .catch(() => []);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(metadata));
            return;
          }

          next();
        } catch (error) {
          console.error('Song storage error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    }
  };
}
