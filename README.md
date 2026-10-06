# OneCommandLine
Work In Progress<br>
<br>
A simple command line.<br>
Press one *customizable* button to open up a small one line window<br>
that supports simple commands:<br>
- `quit | exit` - terminate OneCommandLine
- `restart` - restart OneCommandLine
- `settings` - open OneCommandLine's settings
- `killProcess | exitProcess | killPr | exitPr [processName]` - terminates the given process, be careful
- `setBrightness | brightness | br [value: {1-100}]` - set the brightness of your monitor
- `vol | volume | setVolume [value: {1-100}]` - set the system out volume
- `muteVolume | mute [deviceType: {in | mic | microphone, out | speaker | speakers, all | 'undefined'}]` - mutes the system in/out or both
- `unmuteVolume | unmute [deviceType: {in | mic | microphone, out | speaker | speakers, all | 'undefined'}]` - unmutes the system in/out or both
- `nightmode | nm [state: {on, off}], [startTime (optional): {hh:mm}], [endTime (optional): {hh:mm}]` - enable/disable nightmode or set a time frame
- `system [operation: {shutdown, restart, sleep | sleepmode}]` - shutdown computer, restart computer or activate computer sleepmode
- ...
<br>

## Installation
Prequisits: NodeJS version 22
1. Clone
2. run `npm install`
3. use as dev `npm start` or
4. package to program `npm run make` - the program is in ./out/onecommandline-win32-x64

## Add custom commands
Custom commands can also be added:<br>
1. create your own .js file<br>
2. create an object by the following template:

```javascript
const obj = {
    // the function that executes when you call the command
    // ! your functions parameters can only be of type string
    func: yourFunction,
    
    // all commands that will call the function
    // ! a command can only be one word
    funcNames: ['commandName', 'alternativeCommandName'],
    
    // amount of parameters your function has
    funcParam: int,
    
    // optional, explain what your function does
    // will be displayed in Command List
    // which can be viewed in OCL settings
    description: "",
    
    // optional, explain what your parameters are
    // will be displayed in Command List
    // which can be viewed in OCL settings
    paramDescription: ""
}
```

3. export your object:<br>
`module.exports = {obj} // you can also export multiple objects, seperated by a comma`<br>
4. add your file to 'OneCommandLine\docs\src\commands' directory<br>
5. restart OneCommandLine
