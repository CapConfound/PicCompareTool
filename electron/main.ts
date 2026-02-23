import { app, BrowserWindow, dialog, shell } from 'electron';
import path from 'path';

let win: BrowserWindow | null = null;

async function startApp() {
  // Set data directory to macOS Application Support before importing the server.
  // The server's config.ts reads this env var at module-evaluation time.
  process.env.PICCOMPARE_DATA_DIR = path.join(app.getPath('userData'), 'data');
  process.env.ELECTRON_APP = '1';

  // Resolve paths that differ between packaged and dev runs
  const serverDist = app.isPackaged
    ? path.join(process.resourcesPath, 'app', 'server', 'dist', 'index.js')
    : path.join(__dirname, '..', 'server', 'dist', 'index.js');

  const clientDist = app.isPackaged
    ? path.join(process.resourcesPath, 'app', 'client', 'dist')
    : path.join(__dirname, '..', 'client', 'dist');

  // Use new Function to prevent TypeScript (module: CommonJS) from compiling import() to
  // require(), which cannot load ESM modules. This keeps it as a real dynamic import at runtime.
  const dynamicImport = new Function('p', 'return import(p)') as (p: string) => Promise<unknown>;
  const { startServer } = await dynamicImport(serverDist) as { startServer: (port: number, staticDir: string) => Promise<number> };

  // Port 0 → OS assigns a free port; we get the actual port back
  const port = await startServer(0, clientDist);

  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  await win.loadURL(`http://127.0.0.1:${port}`);

  // Open external links in the system browser, not in the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(startApp).catch((err: unknown) => {
  // Show a visible error dialog instead of silently swallowing startup failures
  dialog.showErrorBox(
    'PicCompareTool failed to start',
    err instanceof Error ? err.stack ?? err.message : String(err)
  );
  app.quit();
});

app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // Re-open a window when the dock icon is clicked (macOS)
  if (win === null) startApp().catch(console.error);
});
