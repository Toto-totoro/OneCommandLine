const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const path = require('path');
const jsonFiles = {
    settings: path.join(__dirname, './settings.json')
}
const shortcutBtn = document.getElementById('shortcutBtn');

/**
 * Send close-settings event to ipcMain
 */
const closeSettingsWindow = () => {
    ipc.send('close-settings')
}

const openShortcutSelectWindow = () => {
    ipc.send('open-shortcut-select');
}

const openFailedImports = () => {
    ipc.send('failed-to-import');
}

const openCommandList = () => {
    ipc.send('display-command-list');
}

const readShortcutKey = () => {
    const rawSettingsJson = fs.readFileSync(jsonFiles.settings);
    let settingsJson = JSON.parse(rawSettingsJson);

    shortcutBtn.innerText = settingsJson.shortcutKey;
}

ipc.on('set-shortcutKey', readShortcutKey)