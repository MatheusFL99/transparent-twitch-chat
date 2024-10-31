window.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron')
    window.ipcRenderer = ipcRenderer
  })
  