const ipc = require('electron').ipcRenderer;

const quit = {
    func:
    /**
     * Send 'quit' signal to ipcMain to quit process
     */
        () => {
        ipc.send('quit');
    },
    funcNames: ['quit', 'exit'],
    funcParam: 0,
    description: "terminate OCL"
}

const restart = {
    func:
    /**
     * Send 'quit' signal to ipcMain to quit process
     */
        () => {
        ipc.send('restart-app');
    },
    funcNames: ['restart'],
    funcParam: 0,
    description: "restarts OCL (useful for reloading commands)"
}

const settings = {
    func:
    /**
     * Send 'open-setting' signal to ipcMain to open OCL settings
     */
        () => {
        ipc.send('open-settings');
    },
    funcNames: ['settings'],
    funcParam: 0,
    description: "open OCL's settings"
}

const test = {
    func:
    /**
     * Send 'open-setting' signal to ipcMain to open OCL settings
     */
        () => {
        ipc.send('open-settings');
    },
    funcNames: ['settings'],
    funcParam: 0
}

const popup = {
    func:
    /**
     * Send 'show-popup' signal to ipcMain to view the window
     */
        () => {
        ipc.send('show-popup');
    },
    funcNames: ['popup'],
    funcParam: 0
}

module.exports = { quit, restart, settings };