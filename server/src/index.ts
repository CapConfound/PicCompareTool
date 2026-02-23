import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { configRouter } from './routes/config.routes.js';
import { filesRouter } from './routes/files.routes.js';
import { imagesRouter } from './routes/images.routes.js';
import { groupsRouter } from './routes/groups.routes.js';
import { rankingRouter } from './routes/ranking.routes.js';

function buildApp(staticDir?: string) {
  const app = express();

  // Allow all origins — this server only listens on localhost, so this is safe
  app.use(cors({ origin: true }));
  app.use(express.json());

  app.use('/api', configRouter);
  app.use('/api', filesRouter);
  app.use('/api', imagesRouter);
  app.use('/api', groupsRouter);
  app.use('/api', rankingRouter);

  // When running inside Electron, serve the built React SPA
  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  return app;
}

/**
 * Start the Express server and return the actual bound port.
 * Pass port=0 to let the OS pick a free port.
 * Pass staticDir to serve the React client build from Express.
 */
export function startServer(port: number, staticDir?: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const app = buildApp(staticDir);
    const server = createServer(app);
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : port;
      console.log(`PicCompareTool server on http://localhost:${actualPort}`);
      resolve(actualPort);
    });
    server.on('error', reject);
  });
}

// Auto-start in dev mode (tsx watch src/index.ts).
// Skipped when ELECTRON_APP=1 is set by the Electron main process before import.
if (!process.env.ELECTRON_APP) {
  void startServer(3001);
}
