const ipc = require('electron').ipcRenderer;

// variables for shortcut setting
const shortcutPlaceholder = document.getElementById('shortcutPlaceholder');
let shortcutKey = "";
let maxKeys = 3;

window.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && shortcutKey !== "") {
        ipc.send('submit-shortcutKey', shortcutKey)
        return;
    }
    if (event.key === 'Backspace') {
        resetShortcutPlaceholder("Press key to set as Shortcut...");
        return;
    }
    if (shortcutKey.toLowerCase().includes(event.key.toLowerCase())) { return; }
    switch (maxKeys) {
        case 0:
            return;
            break;

        case 2:
        case 1:
            shortcutKey += "+";
            break;
    }


    // TODO: fix 'DEAD' letter problem
    // * Currently dead letters are not allowed
    // ! dead letters can't be set as shortcut keys 
    switch (event.key.toUpperCase()) {
        case 'DEAD':
            resetShortcutPlaceholder("Invalid! Please use another key");
            return;
        case ' ':
            shortcutKey += "SPACE";
            break
        default:
            shortcutKey += event.key.toUpperCase();
            break;
    }
    shortcutPlaceholder.innerText = shortcutKey;
    maxKeys--;
})

/**
 * Resets shortcutKey and maxKeys.
 * Prints message to shortcutPlaceholder.
 * @param {string} message 
 */
const resetShortcutPlaceholder = (message) => {
    shortcutKey = "";
    shortcutPlaceholder.innerHTML = message;
    maxKeys = 3;
}