/***********/
/* IMPORTS */
/***********/

const { app, BrowserWindow, Tray, Menu, screen, globalShortcut } = require('electron');
const ipc = require('electron').ipcMain; // receiver
const path = require('path');
const fs = require('fs');
const sudo = require('sudo-prompt');

/*************/
/* FILEPATHS */
/*************/

const jsonFiles = {
    settings: path.join(__dirname,'./docs/settings.json')
}
const htmlFiles = {
    index: './docs/index.html',
    settings: './docs/settings.html',
    shortcutSelect: './docs/shortcutSelect.html',
    popup: './docs/popup.html'
}
const scripts = {
    installModules: path.join(__dirname, './docs/scripts/installModules.ps1')
}
const images = {
    shadow_ico: path.join(__dirname, './docs/img/shadow.ico')
}

/**
 * Changes file paths to the current working directory.
 * If this throws an error it's running in test mode and returns true.
 * @returns {boolean} true if in dev mode, false otherwise
 */
const isDevMode = () => {

    try {
        fs.readFileSync("./resources/app/docs/settings.json");
        return false;

    } catch (e) {
        console.warn("Running in Test Mode\n" + e);
        return true;
    }

}

const devMode = isDevMode();
const devSettings = {};
if (devMode) {
    devSettings['app-blur'] = true;
}

/***********/
/* WINDOWS */
/***********/

// make window variables globally available
let mainWin = null;
let settingsWin = null;
let shortcutSelectWin = null;
let popupWin = null;
// let tray = null;
// Prevent Debug Menu outside DevMode
devMode ? null : Menu.setApplicationMenu(null);

/**
 * Main window
 */
const createWindow = () => {
    // get Screen Dimensions
    const mainScreen = screen.getPrimaryDisplay();
    const dimensions = mainScreen.size;

    // create Window
    mainWin = new BrowserWindow({
        // dimensions
        width: dimensions.width,
        height: 60,
        resizable: false,
        // offset
        x: 0,
        y: 0,
        // frameless
        autoHideMenuBar: true,
        frame: false,
        // display options
        alwaysOnTop: true,
        show: false,
        // allow nodejs usage
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    // overwrite dev settings
    devMode ?
    ipc.on('dev-settings', (e, settings) => {
        for (setting in settings) {
            if(devSettings.hasOwnProperty(setting)) {
                devSettings[setting] = settings[setting];
            }
        }
    }) : null;

    // hide window on focus loss
    ipc.on('app-blur', () => {
        if (!devMode) { mainWin.hide(); return; }
        devSettings['app-blur'] ? mainWin.hide() : null;
    }) 

    // hide window on enter press
    ipc.on('command-submit', () => {
        mainWin.hide();
    })

    // quit process when quit command is received
    ipc.on('quit', () => {
        popupWin.destroy();
        app.quit();
    })

    ipc.on('restart-app', () => {
        popupWin.destroy();
        app.relaunch();
        app.quit();
    })

    // DEV-COMMAND: resize
    devMode ?
    ipc.on('resize-height', (event, height) => {
        mainWin.setResizable(true);
        mainWin.setSize(dimensions.width, Number(height), false);
        mainWin.setResizable(false);
    }) : null;

    ipc.handle('dev-mode?', () => devMode);

    // open up OCL settings when settings command is received
    ipc.on('open-settings', () => {
        if (settingsWin === null || settingsWin.isDestroyed()) createSettingsWindow();
        else { settingsWin.focus() }
    });

    // create Popup window preemptively (but not shown) so it's ready when needed
    createPopupWindow();


    // load html index file into the window
    mainWin.loadFile(path.join(__dirname, htmlFiles.index));

    // create windows system tray with 'Quit' option
    tray = new Tray(images.shadow_ico);
    const contextMenu = Menu.buildFromTemplate([{
        label: 'Quit',
        click: () => {
            popupWin.destroy();
            app.quit();
        }
    }])
    tray.setToolTip('OneCommandLine')
    tray.setContextMenu(contextMenu)

    // installPowerShellModules(); deprecated

    // reads existing shortcutKey || opens window to set shortcutKey
    readShortcutKey();

    ipc.on('open-shortcut-select', shortcutSelectWindow);
}


/**
 * Settings Window
 */
const createSettingsWindow = () => {
    settingsWin = new BrowserWindow({
        // dimensions
        width: 400,
        height: 300,
        resizable: false,
        // frameless
        autoHideMenuBar: true,
        frame: true,
        // display options
        alwaysOnTop: false,
        show: true,
        // allow nodejs usage
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    // load html index file into the window
    settingsWin.loadFile(path.join(__dirname, htmlFiles.settings));

    try {
        ipc.on('close-settings', () => {
            settingsWin.destroy();
        })
    } catch (error) { console.error(error); }

}

/**
 * BrowserWindow in which you can set a key and return the 'submit-shortcutKey' event
 * Used to set new shortcutKey for opening OCL
 */
const shortcutSelectWindow = () => {
    // window settings
    shortcutSelectWin = new BrowserWindow({
        // dimensions
        width: 400,
        height: 300,
        resizable: false,
        // frameless
        autoHideMenuBar: true,
        frame: true,
        // display options
        alwaysOnTop: false,
        show: true,
        // allow nodejs usage
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    // load html file
    shortcutSelectWin.loadFile(path.join(__dirname, htmlFiles.shortcutSelect));

    // handle event from shortcutSelect.html
    ipc.on('submit-shortcutKey', (event, shortcutKey) => {
        setShortcutKey(shortcutKey);
        shortcutSelectWin.destroy();
    })

}

/**
 * Popup Message Window
 */
const createPopupWindow = () => {
    // get Screen Dimensions
    // const mainScreen = screen.getPrimaryDisplay();
    // const dimensions = mainScreen.size;

    popupWin = new BrowserWindow({
        // dimensions updated by window later
        height: 600,
        // maxHeight: dimensions.height,
        width: 700,
        resizable: true,
        // frameless
        autoHideMenuBar: true,
        frame: true,
        // display options
        alwaysOnTop: false,
        show: false,

        // allow nodejs usage
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    popupWin.loadFile(path.join(__dirname, htmlFiles.popup));

    /**********/
    /* Popups */
    /**********/

    ipc.on('failed-to-import', async(e, args) => {
        popupWin.webContents.send('failed-import-popup', args);
    });

    ipc.on('display-command-list', async(e, args) => {
        mainWin.webContents.send('get-command-list');
    });



    /**********/
    /* Events */
    /**********/

    ipc.on('command-list', async(e, args) => {
        popupWin.webContents.send('display-command-list', args);
    })

    /* default */

    popupWin.on('close', (e) => {
        e.preventDefault();
        popupWin.hide();
    })

    /* custom */

    // DEV-COMMAND: resize
    devMode ?
    ipc.on('resize-popup', (event, args) => {
        //if (args[0] < 600) args[0] = 600;
        popupWin.setContentSize(args[0], args[1]);
    }) : null;

    ipc.on('show-popup', () => {
        popupWin.show();
    });

    ipc.on('hide-popup', () => {
        popupWin.hide();
    });

}




/*************/
/* FUNCTIONS */
/*************/

/**
 * Gets and sets the opening shortcut key from settings.json
 */
const readShortcutKey = () => {
    // read settings.json for existing shortcut
    const rawSettingsJson = fs.readFileSync(jsonFiles.settings);
    const settingsJson = JSON.parse(rawSettingsJson);
    // if shortcut does not exist open shortcutSelectWindow
    // else register shortcut
    if (settingsJson.shortcutKey === undefined || null) {
        shortcutSelectWindow();
    } else {
        globalShortcut.register(settingsJson.shortcutKey, () => {
            mainWin.show();
        });
    }
}

/**
 * Sets shortcutKey for opening OCL to 'key'
 * @param {string} key key that exists on keyboard 
 */
const setShortcutKey = (key) => {
    const rawSettingsJson = fs.readFileSync(jsonFiles.settings);
    let settingsJson = JSON.parse(rawSettingsJson);
    // unregister old shortcut
    if (settingsJson.shortcutKey !== undefined || null) {
        globalShortcut.unregister(settingsJson.shortcutKey);
    }
    // register new shortcut
    globalShortcut.register(key, () => {
        mainWin.show();
    });
    // set new shortcut key
    settingsJson.shortcutKey = key;
    fs.writeFileSync(jsonFiles.settings, JSON.stringify(settingsJson, null, 2));

    if (settingsWin !== null && settingsWin !== undefined) {
        settingsWin.webContents.send('set-shortcutKey');
    }
}

//TODO: isolate ps-module installation so that they're installed in the commands where they are used
/**
 * Installs PS modules needed in different functions of OCL
 * @returns 
 */
const installPowerShellModules = async() => {
    const rawSettingsJson = fs.readFileSync(jsonFiles.settings);
    let settingsJson = JSON.parse(rawSettingsJson);

    // check if already installed
    if (settingsJson.installed === undefined) {
        settingsJson.installed = {};
        fs.writeFileSync(jsonFiles.settings, JSON.stringify(settingsJson, null, 2));
        await installPowerShellModules();
    }
    if (settingsJson.installed.powershellModules == true) { return }

    // make sure Powershell scripts are allowed to run
    await allowPowerShellScripts();

    // install via Powershell script
    sudo.exec('Powershell -Command "& ' + '\'' + scripts.installModules + '\'' + '"', { name: 'PSinstall' }, (error) => {
        error && console.log(error);

        if (error !== undefined) { return }
        settingsJson.installed.powershellModules = true;
        fs.writeFileSync(jsonFiles.settings, JSON.stringify(settingsJson, null, 2));
    });
}

const allowPowerShellScripts = async() => {
    const sudo = require('sudo-prompt');
    sudo.exec('Powershell Set-ExecutionPolicy RemoteSigned -Scope CurrentUser', { name: 'PSallowScripts' }, (error) => {
        error && console.log(error);
    });
}

app.on('ready', createWindow)