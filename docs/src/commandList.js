const { ipcRenderer } = require("electron");
const process = require('process');
const fs = require("fs");
const path = require("path");

const commandsDir = path.join(__dirname, '/src/commands');
const devCommandsDir = path.join(commandsDir, 'dev');

const loadedModules = {};
const commandList = [];
const INVALID_COMMANDS = [];

/**
 * Checks whether imported command has the valid object properties.
 * @param {object} command imported command to check
 * @returns true for valid command syntax, false for invalid command syntax
 */
const checkCommandImport = (command) => {
    const validCommand = 'func' in command && typeof command['func'] === 'function' &&
        'funcNames' in command && Array.isArray(command['funcNames']) && typeof command.funcNames[0] === 'string' &&
        'funcParam' in command && typeof command['funcParam'] === 'number';

    if (!validCommand) {

        /* delete every property from command because they might make the object a DOM object
         which you aren't allowed to pass with ipcRender.send
         This process also replenishes the wanted properties
        */
        try {
            let file = command.file
            let funcNames = undefined;
            if (command.funcNames !== undefined) { funcNames = command.funcNames; }
            for (key in command) { delete command[key] }
            command.file = file;
            command.funcNames = funcNames;
        } catch (error) {}

        command.reject_reason = "invalid command format";
        if (command.funcNames === undefined) { command.funcNames = ["\'unidentified command\'"] }
        INVALID_COMMANDS.push(command);
        console.error("Tried to import " + command.funcNames + " from " + command.file + " which is not in valid command format.");
    }

    return validCommand;
};

/**
 * Checks if a command name is already used
 * @param {object} command import command to check
 * @param {string} fileName name of file containing the command
 * @returns true for duplicate import, false for unique import
 */
const checkDuplicateImport = (command) => {
    // looks for duplicate names
    let foundDuplicate = commandList.some(element => element.funcNames.some(str => command.funcNames.includes(str)));
    if (foundDuplicate) {
        // gotta delete or else it becomes a DOM object
        delete command.func;
        command.reject_reason = "duplicate command name";
        INVALID_COMMANDS.push(command);
        console.error("A command object in module " + command.file + " contains a duplicate command name. One of the following names is already in use: " + command.funcNames);
        return true;
    }
    return false;
}


const fileImportError = (fileName) => {
    let command = {
        reject_reason: "failed to import file - there was probably an error in the files code",
        file: fileName,
        funcNames: ""
    }
    INVALID_COMMANDS.push(command);
    console.error("Something went wrong whilst trying to import " + fileName + "! \nPlease check the file and you may use the 'restart' command to restart OCL.")
}

/**
 * Import all modules from commands folder
 * => modules are stored in loadedModules  
 * => objects from loadedModules are stored in commandList  
 * => duplicates are filtered out
 * @param {string} directory absolute path to the commands directory
 */
const importCommands = (directory) => {
    console.log("Importing commands from " + directory);
    fs.readdir(directory, (err, files) => {
        if (err) {
            fileImportError(directory);
            console.error(err);
            invalidCommandsPopup();
            return;
        }
        files = files.filter(f => path.extname(f).toLowerCase() === '.js');
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            try {
                loadedModules[fileName] = require(path.join(directory, fileName));
            } catch (error) {
                fileImportError(fileName);
                console.error(error);
                continue;
            }
            for (let obj in loadedModules[fileName]) {
                const command = loadedModules[fileName][obj];
                command.file = fileName;
                if (!checkCommandImport(command)) { continue }
                if (checkDuplicateImport(command)) { continue }
                commandList.push(command);
            }
        }
        invalidCommandsPopup();
    });
}


ipc.invoke('dev-mode?').then((devMode) => {
    if(devMode){
        importCommands(devCommandsDir);
    }
    importCommands(commandsDir);
})

const invalidCommandsPopup = () => {
    if (INVALID_COMMANDS.length !== 0) {
        ipcRenderer.send('failed-to-import', INVALID_COMMANDS);
    }
}

ipcRenderer.on('get-command-list', () => {
    let COMMAND_LIST = JSON.parse(JSON.stringify(commandList));
    COMMAND_LIST.forEach(cmd => delete cmd.func)
    ipcRenderer.send('command-list', COMMAND_LIST);
})