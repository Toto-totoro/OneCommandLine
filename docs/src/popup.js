const ipc = require('electron').ipcRenderer;
let INVALID_IMPORTS = [];

const pageLayouts = {
    head: {
        failed_import_popup: `
            <title>Failed Command Imports</title>
        `
    },
    body: {
        failed_import_popup: `
            <header>
                <h1>Failed to Import</h1>
            </header>

            <table id="duplicate-commands-tbl">
                <tr id="head-tr">
                    <td>Command</td>
                    <td>Reason</td>
                    <td>File Origin</td>
                </tr>
                <br>
            </table>
            `,

        command_list_popup: `
            <header>
                <h1>Command List</h1>
            </header>

            <table id="command-list-tbl">
                <tr id="head-tr">
                    <td>Command</td>
                    <td>Parameters</td>
                    <td>Description</td>
                </tr>
                <br>
            </table>
            `

    }
}

/**
 * Loads the specified html from object 'pageLayouts'
 * @param {string} layout 
 */
const setLayout = (layout) => {
    //document.head.innerHTML += pageLayouts.head[layout];
    document.body.innerHTML = pageLayouts.body[layout];
}

/**
 * Sends resize event + dimensions to main.js
 * which then resizes the window
 */
const resizeWindow = (min_width = 0, min_height = 0) => {
    const html = document.getElementsByTagName('html')[0];
    let [pageWidth, pageHeight] = [html.offsetWidth, html.offsetHeight];
    if (pageWidth < min_width) { pageWidth = min_width };
    if (pageHeight < min_height) { pageHeight = min_height };
    ipc.send('resize-popup', [pageWidth, pageHeight]);

}

/**
 * Determines Popup Window Visibility
 * @param {boolean} visible true || false
 */
const setWindowVisible = (visible) => {
    switch (visible) {
        case true:
            ipc.send('show-popup');
            break;
        case false:
            ipc.send('hide-popup');
            break;
        default:
            throw 'Not a boolean!'
    }
}


ipc.on('failed-import-popup', (event, args) => {
    setLayout('failed_import_popup');

    /**
     * generates table showing the duplicate command name (if available),
     * the reason for the failed import
     * and their source file
     */
    if (args !== undefined) INVALID_IMPORTS = args;
    const table = document.getElementById('duplicate-commands-tbl');


    INVALID_IMPORTS.forEach(command => {
        const tr = table.appendChild(document.createElement('tr'));

        const cmd_td = tr.appendChild(document.createElement('td'));
        cmd_td.textContent = command.funcNames.join(" | ");

        const reason_td = tr.appendChild(document.createElement('td'))
        reason_td.textContent = command.reject_reason;

        const file_td = tr.appendChild(document.createElement('td'))
        file_td.textContent = command.file;
    });

    resizeWindow(700);
    setWindowVisible(true);
})

ipc.on('display-command-list', (e, args) => {
    setLayout('command_list_popup');

    let COMMAND_LIST = args;
    const table = document.getElementById('command-list-tbl');

    COMMAND_LIST.forEach(command => {
        const tr = table.appendChild(document.createElement('tr'));

        const cmd_td = tr.appendChild(document.createElement('td'));
        cmd_td.textContent = command.funcNames.join(" | ");

        const parameters_td = tr.appendChild(document.createElement('td'))
        command.paramDescription !== undefined && command.funcParam !== 0 ? parameters_td.textContent = command.funcParam + " => " + command.paramDescription : parameters_td.textContent = command.funcParam;

        const description_td = tr.appendChild(document.createElement('td'))
        try {
            description_td.textContent = command.description;
        } catch (error) {}
    });

    resizeWindow(700);
    setWindowVisible(true);
})