const { ipcRenderer } = require("electron");
const process = require('process');
const fs = require("fs");
const path = require("path");

/*
 0 => directory path for fs
 1 => directory path for require
*/
const commandsDir = ['./docs/src/commands/', './src/commands/'];
const devCommandsDir = ['./docs/src/commands/dev', './src/commands/dev/'];

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
 * @param {string[]} directory
 * The first element of the array will be read by fs.readdir 
 * so it either needs to be an absolute path or a relative path starting from the installation folder.
 * It should only be relative if the directory is within the installation folder.  
 * If the first element is an absolute path there is no second element needed.  
 * Otherwise it should be the same as the first element but starting from the docs folder (which is in the installation folder).
 *   
 * @example
 * const directory = ['./docs/mycommandfolder', './mycommandfolder']
 */
const importCommands = (directory) => {
    fs.readdir(directory[0], (err, files) => {
        files = files.filter(f => path.extname(f).toLowerCase() === '.js');
        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            try {
                if(directory[0].startsWith('.')){
                    loadedModules[fileName] = require(path.join(__dirname, directory[1], fileName));
                } else{
                    loadedModules[fileName] = require(path.join(directory[0], fileName));
                }
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
    }else{
        commandsDir[0] = commandsDir[0].replace('./', './resources/app/');
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