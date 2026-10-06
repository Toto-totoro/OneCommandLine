const loudness = require('loudness');
const execSync = require('child_process').execSync;
const { PowerShell } = require('node-powershell');
const path = require('path');

const svclPath = path.join(__dirname, '../../../SoundVolumeView/');

/**
 * Executes a PowerShell command which returns a list of all available
 * Audio Devices. This list is then turned into JSON format, returned and also stored as such in
 * audioDevices.json
 * @return {object[]} list of all available Audio Devices
 */
const getAudioDevices = async() => {

    // create PowerShell
    const ps = new PowerShell({
        executionPolicy: 'Bypass',
        noProfile: true
    });

    // pass command to PowerShell
    const command = PowerShell.command `Get-AudioDevice -List | ConvertTo-Json`;

    // execute and return command output
    const output = await ps.invoke(command);
    ps.dispose();

    // log output
    const result = JSON.parse(output.raw);

    return result;
};

/**
 * Filters Audio Device List for Input/Output devices.
 * @param {string} DEVICE_TYPE "Playback" or "Recording"
 * @returns {object[]} List of Audio Output Devices (+ details about them)
 */
const getFilteredAudioDevices = async(DEVICE_TYPE) => {
    //return on invalid device type
    if (DEVICE_TYPE != "Playback" && DEVICE_TYPE != "Recording") { return };

    //get device list from json file
    const jAudioDevices = await getAudioDevices(); //require(audioDevicesJSON);

    //filter device list for DEVICE_TYPE
    const jAudioOutDevices = _.where(jAudioDevices, {
        Type: DEVICE_TYPE
    });

    return jAudioOutDevices;
}

/**
 * Returns the system default audio device, either in or out
 * @param {string} DEVICE_TYPE "Playback" or "Recording"
 */
const getDefaultAudioDevice = async(DEVICE_TYPE) => {
    const devices = await getFilteredAudioDevices(DEVICE_TYPE);

    //return on invalid device type
    if (devices == undefined) {
        throw new Error("Invalid Device Type:\nAudio Device Type \"" + DEVICE_TYPE + "\" not Recognized");
    };

    for (let i = 0; i < devices.length; i++) {
        // get Default Audio Device
        if (devices[i].Default == true) {
            return devices[i];
        }
    }
}


const setVolume = {
    func:
    /**
     * Sets the sound volume to value
     * @param {Number} value 1-100
     */
        (value) => {
        if (isNaN(value)) { return console.error('Command: setVolume; Value must be a number'); }
        if (0 > parseInt(value) || parseInt(value) > 100) { return console.error('Command: setVolume; Value must be between 1 and 100') }
        loudness.setVolume(parseInt(value));
    },
    funcNames: ['setVolume', 'volume', 'vol'],
    funcParam: 1,
    description: "set the system out volume",
    paramDescription: "[value: {1-100}]"
}

const muteVolume = {
    func:
    /**
     * Mutes system volume of input, output or both
     */
        async(deviceType) => {

        let muteState = await loudness.getMuted();
        const muteCommand = '"' + svclPath + 'svcl.exe"' + ' /Mute "DefaultCaptureDevice"';

        switch (deviceType) {
            case 'in':
            case 'mic':
            case 'microphone':
                execSync(muteCommand);
                await loudness.setMuted(muteState);
                break;

            case 'out':
            case 'speaker':
            case 'speakers':
                loudness.setMuted(true);
                break;

            case 'all':
            case undefined:
                execSync(muteCommand);
                loudness.setMuted(true);
                break;
        }
    },
    funcNames: ['muteVolume', 'mute'],
    funcParam: 1,
    description: "mutes the system in/out or both",
    paramDescription: "[deviceType: {in | mic | microphone, out | speaker | speakers, all | 'undefined'}]"
}

const unmuteVolume = {
    func:
    /**
     * Unmutes system volume of input, output or both
     */
        async(deviceType) => {

        let muteState = await loudness.getMuted();
        const unmuteCommand = '"' + svclPath + 'svcl.exe"' + ' /Unmute "DefaultCaptureDevice"';

        switch (deviceType) {
            case 'in':
            case 'mic':
            case 'microphone':
                execSync(unmuteCommand);
                await loudness.setMuted(muteState);
                break;

            case 'out':
            case 'speaker':
            case 'speakers':
                loudness.setMuted(false);
                break;

            case 'all':
            case undefined:
                execSync(unmuteCommand);
                loudness.setMuted(false);
                break;
        }
    },
    funcNames: ['unmuteVolume', 'unmute'],
    funcParam: 1,
    description: "unmutes the system in/out or both",
    paramDescription: "[deviceType: {in | mic | microphone, out | speaker | speakers, all | 'undefined'}]"
}

module.exports = { setVolume, muteVolume, unmuteVolume }