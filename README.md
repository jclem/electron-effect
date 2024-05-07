# Effect / Electron IPC Handlers

This repository demonstrates a problem that arises when one wants to use
services created with Effect inside of Electron IPC handlers, which are event
listeners whose callbacks must return a value, and that value is then sent back
to the renderer process by the Electron runtime.

## Running

Note that I have only tested this on macOS.

```sh
$ git clone https://github.com/jclem/electron-effect
$ cd electron-effect
$ npm install
$ npm start
```

## Tour

- `src/main.ts` is the main Electron process. It sets up our Effect program and IPC handlers.
- `src/renderer.ts` is the renderer process. It sends a message to the main process and logs the response.
- `src/preload.ts` defines our IPC API.