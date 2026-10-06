const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const path = require('path');

const scripts = {
    nightmode_schedule: path.join(__dirname, "../../scripts/nightmode-schedule.ps1")
}


const allowPowerShellScriptsAndRetry = () => {
    const sudo = require('sudo-prompt');
    sudo.exec('Powershell Set-ExecutionPolicy RemoteSigned -Scope CurrentUser', { name: 'PSallowScripts' }, (error) => {
        if(error !== undefined) {throw error}

        sudo.exec('Powershell.exe -Command "& ' + '\'' + scripts.nightmode_schedule + '\'' + '"',
        {name: "nightmodeOn2"},
        (error) => {console.error(error);}
    );
    });
}

const nightmode = {
    func: async(state, startTime = "11:45", endTime = "11:30") => {
        const startHour = startTime.split(":")[0];
        const startMinutes = startTime.split(":")[1] === undefined ? 0 : startTime.split(":")[1];
        const endHour = endTime.split(":")[0];
        const endMinutes = endTime.split(":")[1] === undefined ? 0 : endTime.split(":")[1];
        let stateBool;
        switch (state) {
            case "on":
            case "true":
                stateBool = "true";
                break

            case "off":
            case "false":
                stateBool = "false";
        }
        if (stateBool === undefined || startHour === undefined || startMinutes === undefined || endHour === undefined || endMinutes === undefined) { return }
        let data = "Set-BlueLightReductionSettings" + " -StartHour " + startHour + " -StartMinutes " + startMinutes + " -EndHour " + endHour + " -EndMinutes " + endMinutes + " -Enabled $" + stateBool + " -NightColorTemperature 3500";


        let fileText = fs.readFileSync(scripts.nightmode_schedule).toString().split("\n");
        fileText.splice(1, 1, data);
        let text = fileText.join("\n");

        fs.writeFile(scripts.nightmode_schedule, text, function(err) {
            if (err) return console.error(err);
        });

        const options = {
            name: "nightmodeOn"
        };

        const sudo = require('sudo-prompt');
        sudo.exec('Powershell.exe -Command "& ' + '\'' + scripts.nightmode_schedule + '\'' + '"',
            options,
            (error) => {
                error && console.error(error);
                
                
                if(error !== undefined) {
                    if(error.message === "User did not grant permission."){return}
                    // try to give permission
                    // TODO: split into 2 functions (very hard)
                    //* The problem is that the "allowPowerShellScripts" function is resolved before the callback from sudo.exec is called.
                    //* That means you can't use async/await nor then/catch because function will just return undefined.
                    //* You'd have to await the callback from sudo.exec, but I don't know how.
                    allowPowerShellScriptsAndRetry();
                }
        });

    },
    funcNames: ["nightmode", "nm"],
    funcParam: 3,
    description: "enable/disable nightmode or set a time frame",
    paramDescription: "[state: {on, off}], [startTime (optional): {hh:mm}], [endTime (optional): {hh:mm}]"
};

module.exports = { nightmode }