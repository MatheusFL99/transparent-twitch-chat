const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

let mainWindow;
let chatWindow;
let isClickThrough = false;
let configPath = path.join(__dirname, "config.json");

function loadConfig() {
  if (fs.existsSync(configPath)) {
    const data = fs.readFileSync(configPath);
    const config = JSON.parse(data);

    return {
      lastUser: config.lastUser || "",
      chatPosition: config.chatPosition || { x: 100, y: 100 },
      transparency:
        config.transparency !== undefined ? config.transparency : 100,
      isClickThrough:
        config.isClickThrough !== undefined ? config.isClickThrough : false,
    };
  }
  return {
    lastUser: "",
    chatPosition: { x: 100, y: 100 },
    transparency: 100,
    isClickThrough: false,
  };
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config));
}

function createWindow() {
  const config = loadConfig();
  isClickThrough = config.isClickThrough;

  mainWindow = new BrowserWindow({
    width: 447,
    height: 309,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    if (config.lastUser) {
      mainWindow.webContents.send("load-user", config.lastUser);
    }

    mainWindow.webContents.send("update-click-through", isClickThrough);
    mainWindow.webContents.send("set-transparency", config.transparency);
  });

  ipcMain.on("toggle-click-through", () => {
    isClickThrough = !isClickThrough;
    config.isClickThrough = isClickThrough;
    saveConfig(config);
    if (chatWindow) {
      chatWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });

      // Ajustar o comportamento do CSS
      if (isClickThrough) {
        chatWindow.webContents.executeJavaScript(`
          document.body.style.pointerEvents = 'none'; 
        `);
      } else {
        chatWindow.webContents.executeJavaScript(`
          document.body.style.pointerEvents = 'auto'; 
        `);
      }
    }
  });

  ipcMain.on("save-user", (event, username) => {
    config.lastUser = username;
    saveConfig(config);
  });

  ipcMain.on("open-chat", (event, username) => {
    if (!username) {
      console.log("Nome de usuário não fornecido!");
      return;
    }

    console.log("Abrindo chat para o usuário:", username);

    // Verificar se o chatWindow existe e não foi destruído
    if (chatWindow && !chatWindow.isDestroyed()) {
      chatWindow.close();
    }

    const { x, y } = config.chatPosition || { x: 100, y: 100 };

    chatWindow = new BrowserWindow({
      width: 400,
      height: 600,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      x: x,
      y: y,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const chatURL = `https://www.twitch.tv/popout/${username}/chat`;
    console.log("URL do chat:", chatURL);
    chatWindow.loadURL(chatURL);

    chatWindow.setOpacity(config.transparency / 100);
    chatWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });

    chatWindow.once("ready-to-show", () => {
      chatWindow.webContents.insertCSS(`
        body {
          margin: 0;
          padding: 0;
        }
        .drag-area {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 30px;
          -webkit-app-region: drag; /* Habilita arrastar */
          background-color: rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }
        /* Ocultar as divs com as classes específicas */
        .Layout-sc-1xcs6mc-0.hsXgFK, 
        .Layout-sc-1xcs6mc-0.fiHaCw.stream-chat-header, 
        .Layout-sc-1xcs6mc-0.kILIqT.chat-input,
        .Layout-sc-1xcs6mc-0.community-highlight-stack__card.community-highlight-stack__card--wide { 
          display: none !important; /* Garante que esses elementos não apareçam */
        }
      `);

      chatWindow.webContents.executeJavaScript(`
        const dragArea = document.createElement('div');
        dragArea.classList.add('drag-area');
        document.body.appendChild(dragArea);
      `);
    });

    chatWindow.on("move", () => {
      const [x, y] = chatWindow.getPosition();
      config.chatPosition = { x, y };
      saveConfig(config);
    });
  });

  ipcMain.on("adjust-opacity", (event, value) => {
    if (chatWindow) {
      chatWindow.setOpacity(value / 100);
      config.transparency = value;
      saveConfig(config);
    }
  });

  ipcMain.on("minimize-window", () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.on("close-window", () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
