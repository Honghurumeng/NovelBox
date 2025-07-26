const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const process = require('process');
const { net } = require('electron');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In development, load from Vite dev server, in production load from dist folder
  if (process.env.NODE_ENV === 'development') {
    // Wait for Vite dev server to be ready
    mainWindow.loadURL('http://127.0.0.1:5173').catch(err => {
      console.log('Failed to load URL, retrying in 1 second...');
      setTimeout(() => {
        mainWindow.loadURL('http://127.0.0.1:5173').catch(err => {
          console.error('Failed to load URL after retry:', err);
        });
      }, 1000);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Storage configuration
let userDataPath = app.getPath('userData');
let customStoragePath = null;

// Ensure storage directory exists
async function ensureStorageDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Get current storage path
function getStoragePath() {
  return customStoragePath || userDataPath;
}

// Get novels file path
function getNovelsFilePath() {
  return path.join(getStoragePath(), 'novels.json');
}

// IPC handlers for file operations
ipcMain.handle('storage:selectDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择小说存储目录'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    customStoragePath = result.filePaths[0];
    await ensureStorageDir(customStoragePath);
    return customStoragePath;
  }
  return null;
});

ipcMain.handle('storage:getCurrentPath', () => {
  return getStoragePath();
});

ipcMain.handle('storage:resetToDefault', () => {
  customStoragePath = null;
  return userDataPath;
});

ipcMain.handle('storage:saveNovels', async (event, novelsData) => {
  try {
    const storageDir = getStoragePath();
    await ensureStorageDir(storageDir);
    
    const filePath = getNovelsFilePath();
    await fs.writeFile(filePath, JSON.stringify(novelsData, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('保存小说数据失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('storage:loadNovels', async () => {
  try {
    const filePath = getNovelsFilePath();
    const data = await fs.readFile(filePath, 'utf8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: true, data: [] };
    }
    console.error('加载小说数据失败:', error);
    return { success: false, error: error.message };
  }
});

// AI Provider model fetching
ipcMain.handle('ai:fetchModels', async (event, providerType, baseUrl, apiKey) => {
  try {
    let url;
    let headers;

    if (providerType === 'OpenAI') {
      const baseURL = baseUrl || 'https://api.openai.com/v1';
      url = `${baseURL}/models`;
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
    } else if (providerType === 'Gemini') {
      const baseURL = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
      url = `${baseURL}/models?key=${apiKey}`;
      headers = {
        'Content-Type': 'application/json'
      };
    } else {
      throw new Error('Unsupported provider type');
    }

    // Use Electron's net module for network requests
    const response = await new Promise((resolve, reject) => {
      const request = net.request({
        method: 'GET',
        url: url
      });

      // Set headers
      for (const [key, value] of Object.entries(headers)) {
        request.setHeader(key, value);
      }

      request.on('response', (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: response.statusCode,
              headers: response.headers,
              data: jsonData
            });
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.end();
    });

    if (response.statusCode >= 400) {
      throw new Error(`HTTP error! status: ${response.statusCode}`);
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.error('获取模型列表失败:', error);
    return { success: false, error: error.message };
  }
});