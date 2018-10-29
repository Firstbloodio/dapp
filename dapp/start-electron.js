/*const electron = require("electron"),
  proc = require("child_process"),
  child = proc.spawn(electron, ["."]);
*/

const path = require('path')
const spawn = require('child_process').spawn
const request = require("request")

process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const options = {
  env: process.env,
  stdio: 'inherit',
  shell: true
}

/*spawn(".\\node.exe", ["./app/resources/bin/www"], {
    cwd: process.cwd()
})*/

const muon = spawn('electron', [__dirname, ...process.argv.slice(2)], options)

muon.on('error', (err) => {
  console.error(`could not start electron ${err}`)
})

muon.on('exit', (code, signal) => {
  console.log(`process exited with code ${code}`)
  process.exit(code)
})

muon.on('SIGTERM', () => {
  electron.kill('SIGTERM')
})

muon.on('SIGINT', () => {
  electron.kill('SIGINT')
})
