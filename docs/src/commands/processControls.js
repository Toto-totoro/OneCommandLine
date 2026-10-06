const findProcess = require('find-process');


const killProcess = {
    func:
    /**
     * Sends exit signal to given process.
     * @param {string} processName name of an active process
     */
        (processName) => {
        findProcess('name', processName).then((foundProcess) => {
            if (foundProcess[0] === undefined || null) { console.error("Process not found"); return; }
            process.kill(foundProcess[0].pid);
        }, function(err) {
            console.log(err.stack || err);
        });
    },
    funcNames: ['killProcess', 'exitProcess', 'killPr', 'exitPr'],
    funcParam: 1,
    description: "terminates the given process, be careful",
    paramDescription: "[processName]"
}



module.exports = { killProcess }