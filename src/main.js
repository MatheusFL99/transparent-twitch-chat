const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs").promises;
const path = require("path");

let mainWindow;
let chatWindow;
let isClickThrough = false;
const configPath = path.join(app.getPath("userData"), "config.json");

const defaultConfig = {
  lastUser: "",
  chatPosition: { x: 100, y: 100 },
  chatWindowSize: { width: 400, height: 600 },
  transparency: 100,
  isClickThrough: false,
  mainWindowSize: { width: 447, height: 309 },
  mainWindowPosition: { x: undefined, y: undefined },
};

const loadConfig = async () => {
  try {
    const data = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(data);
    return { ...defaultConfig, ...config };
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Erro ao carregar a configuração:", error);
    }
    return defaultConfig;
  }
};

const saveConfig = async (config) => {
  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao salvar a configuração:", error);
  }
};

const createMainWindow = (config) => {
  mainWindow = new BrowserWindow({
    width: config.mainWindowSize.width,
    height: config.mainWindowSize.height,
    x: config.mainWindowPosition.x,
    y: config.mainWindowPosition.y,
    transparent: true,
    frame: false,
    resizable: true,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.once("ready-to-show", () => {
    if (config.lastUser) {
      mainWindow.webContents.send("load-user", config.lastUser);
    }
    mainWindow.webContents.send("update-click-through", isClickThrough);
    mainWindow.webContents.send("set-transparency", config.transparency);
  });

  mainWindow.on("resize", () => {
    const [width, height] = mainWindow.getSize();
    config.mainWindowSize = { width, height };
    saveConfig(config);
  });

  mainWindow.on("move", () => {
    const [x, y] = mainWindow.getPosition();
    config.mainWindowPosition = { x, y };
    saveConfig(config);
  });

  mainWindow.on("close", () => {
    const [width, height] = mainWindow.getSize();
    const [x, y] = mainWindow.getPosition();
    config.mainWindowSize = { width, height };
    config.mainWindowPosition = { x, y };
    saveConfig(config);
  });
};

const createChatWindow = (config, username) => {
  if (!username) {
    console.log("Nome de usuário não fornecido!");
    return;
  }

  console.log("Abrindo chat para o usuário:", username);

  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.close();
  }

  const { x, y } = config.chatPosition;
  const { width, height } = config.chatWindowSize;

  chatWindow = new BrowserWindow({
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    x,
    y,
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
        -webkit-app-region: drag;
        background-color: rgba(0, 0, 0, 0.1);
        z-index: 1000;
      }
      .Layout-sc-1xcs6mc-0.hsXgFK,
      .Layout-sc-1xcs6mc-0.fiHaCw.stream-chat-header,
      .Layout-sc-1xcs6mc-0.kILIqT.chat-input,
      .Layout-sc-1xcs6mc-0.community-highlight-stack__card.community-highlight-stack__card--wide {
        display: none !important;
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

  chatWindow.on("resize", () => {
    const [width, height] = chatWindow.getSize();
    config.chatWindowSize = { width, height };
    saveConfig(config);
  });

  chatWindow.on("close", () => {
    const [width, height] = chatWindow.getSize();
    const [x, y] = chatWindow.getPosition();
    config.chatWindowSize = { width, height };
    config.chatPosition = { x, y };
    saveConfig(config);
  });
};

const createWindow = async () => {
  const config = await loadConfig();
  isClickThrough = config.isClickThrough;

  createMainWindow(config);

  ipcMain.on("toggle-click-through", () => {
    isClickThrough = !isClickThrough;
    config.isClickThrough = isClickThrough;
    saveConfig(config);
    if (chatWindow) {
      chatWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });
      chatWindow.webContents.executeJavaScript(`
        document.body.style.pointerEvents = '${isClickThrough ? "none" : "auto"}';
      `);
    }
  });

  ipcMain.on("save-user", (event, username) => {
    config.lastUser = username;
    saveConfig(config);
  });

  ipcMain.on("open-chat", (event, username) => {
    createChatWindow(config, username);
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
};

app.whenReady().then(createWindow).catch((error) => {
  console.error("Erro ao criar a janela:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Erro não tratado:", error);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
