const ipc = require('electron').ipcRenderer; // sender

const COMMAND_INPUT_ELEMENT_ID = 'commandInput';

/**
 * EventListener
 * If Enter is pressed:
 * 1. Check if there is an element with COMMAND_INPUT_ELEMENT_ID id
 * 2. Send command-submit event to main.js
 * 3. Return if command value is empty, no need to execute
 * 4. Execute commandHandler => 
 *      command is taken from COMMAND_INPUT_ELEMENT_ID element
 *      returns true if command was executed => clears value of COMMAND_INPUT_ELEMENT_ID element
 *      returns false if command was not executed => console.error that command does not exist
 */
window.addEventListener('keypress', (event) => {
    if (event.key != 'Enter') { return }
    // 1.
    if (document.getElementById(COMMAND_INPUT_ELEMENT_ID) == undefined || null) { return }
    // 2.
    ipc.send('command-submit');
    // 3.
    if (document.getElementById(COMMAND_INPUT_ELEMENT_ID).value == "") { return }
    // 4.
    commandHandler(getCommand(COMMAND_INPUT_ELEMENT_ID)) ? clearInput(COMMAND_INPUT_ELEMENT_ID) : console.error('Not a command');
})


const lostFocus = () => {
    ipc.send('app-blur');
}