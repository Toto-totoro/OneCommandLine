/**
 * Returns the value of an element as string. Used to pass as command to an command handler.
 * @param {string} elementId ID of the element
 * @returns {string} Value of the element
 */
const getCommand = (elementId) => {
    const commandInput = document.getElementById(elementId);
    const command = commandInput.value;
    return command
}

/**
 * Empties the elements value attribute.
 * @param {string} elementId ID of the element
 */
const clearInput = (elementId) => {
    const element = document.getElementById(elementId);
    element.value = "";
}

/**
 * Splits command into name, value and properties for the commandHandler function.
 * @param {string} command 
 * @returns {object} command split into name, value and properties
 */
const splitCommand = (command) => {
    let commandSplit = command.split(" ");

    let commandName = commandSplit[0];
    let commandValues = commandSplit.filter(x => { return x !== commandName; });

    return {
        name: commandName,
        values: commandValues
    }
}

/**
 * Executes the given command if it exists within commandList.
 * @param {string} input command
 * @returns {boolean} command was successfully executed ?
 */
const commandHandler = (input) => {
    let commandExecuted = false;
    let command = splitCommand(input);

    for (i in commandList) {
        if (!commandList[i].funcNames.includes(command.name)) { continue }

        if (commandList[i].funcParam > 0 && !undefined) {
            commandList[i].func.apply(undefined, command.values);
        } else {
            commandList[i].func();
        }
        return commandExecuted = true;
    }
    return commandExecuted;
}