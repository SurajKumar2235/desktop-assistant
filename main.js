const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// Create a high-res programmatic tray icon so no missing asset errors occur
function createDefaultTrayIcon() {
  const canvasSize = 32;
  const svgString = `
    <svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f0ff" />
          <stop offset="100%" stop-color="#7000ff" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#grad)" />
      <circle cx="16" cy="16" r="6" fill="#0b0f19" />
      <circle cx="16" cy="16" r="3" fill="#00f0ff" />
    </svg>
  `;
  return nativeImage.createFromBuffer(Buffer.from(svgString)).resize({ width: 16, height: 16 });
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const windowWidth = 460;
  const windowHeight = 720;
  // Position at bottom-right corner as specified in the quick-access design plan
  const xPos = screenWidth - windowWidth - 24;
  const yPos = screenHeight - windowHeight - 24;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: xPos,
    y: yPos,
    frame: false,
    transparent: true,
    resizable: true,
    minWidth: 380,
    minHeight: 520,
    alwaysOnTop: false,
    skipTaskbar: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false // allow local Three.js asset/module loading
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Window close intercepts to hide in tray unless quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('blur', () => {
    // If not pinned, optional auto-hide could be enabled here
  });
}

function setupTray() {
  const icon = createDefaultTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('AI 3D Assistant');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Toggle Assistant',
      accelerator: 'Alt+Space',
      click: () => toggleWindow()
    },
    {
      label: 'Reset Position (Bottom-Right)',
      click: () => resetWindowPosition()
    },
    { type: 'separator' },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: false,
      click: (menuItem) => {
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(menuItem.checked);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    toggleWindow();
  });
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function resetWindowPosition() {
  if (!mainWindow) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const [w, h] = mainWindow.getSize();
  mainWindow.setPosition(screenWidth - w - 24, screenHeight - h - 24);
  mainWindow.show();
}

function registerShortcuts() {
  // Configurable shortcut: Alt+Space (or Ctrl+Shift+Space as fallback)
  try {
    globalShortcut.register('Alt+Space', () => {
      toggleWindow();
    });
  } catch (err) {
    console.warn('Alt+Space registration failed, fallback to CommandOrControl+Shift+Space', err);
  }

  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    toggleWindow();
  });
}

// IPC Handlers
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-hide', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('window-toggle-pin', (event, shouldPin) => {
  if (mainWindow) {
    const isPinned = shouldPin !== undefined ? shouldPin : !mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(isPinned);
    return isPinned;
  }
  return false;
});

ipcMain.handle('window-get-pinned', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : false;
});

app.whenReady().then(() => {
  createWindow();
  setupTray();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep alive in tray
  }
});
