const system = {

    func:
    /**
     * performs different system-related operations based on parameter
     * - shutdown
     * - restart
     * - enter sleepmode
     */
        (operation) => {
        const { exec } = require('child_process');
        switch (operation) {
            case "shutdown":
                exec('shutdown -s -t 00');
                break;
            case "restart":
                exec('shutdown -r -t 00')
                break;
            case "sleepmode":
            case "sleep":
                exec('rundll32.exe powrprof.dll, SetSuspendState Sleep');
                break;
        }
    },
    funcNames: ['system'],
    funcParam: 1,
    description: "shutdown, restart or sleep your pc",
    paramDescription: "[operation: {shutdown, restart, sleep | sleepmode}]"

}

module.exports = { system }