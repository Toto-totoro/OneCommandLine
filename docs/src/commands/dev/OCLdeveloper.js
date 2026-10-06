const ipc = require('electron').ipcRenderer;

const resize = {
    func:
    /**
     * resize OCL main window height
     * @param {string} height
     */
    (height) => {
        ipc.send('resize-height', height);
    },
    funcNames: ['dev-resize-height'],
    funcParam: 1,
    description: "resize OCL's height",
    paramDescription: "[value]"
}

const appblur = {
    func:
    /**
     * enable/disable app blur
     * @param {string} appblur
     */
    (appblur) => {
        appblur = (appblur.toLowerCase() === 'true' ? true : false)
        ipc.send('dev-settings', {'app-blur': appblur});
    },
    funcNames: ['dev-appblur'],
    funcParam: 1,
    description: "enable/disable app blur",
    paramDescription: "[{true | false}]"
}

module.exports = { resize, appblur };