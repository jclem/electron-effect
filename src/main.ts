import { Context, Effect, Schedule } from "effect";
import { BrowserWindow, app, ipcMain } from "electron";
import path from "path";

class RandomData extends Context.Tag("RandomData")<
  RandomData,
  {
    getRandomData(length: number): Effect.Effect<string>;
  }
>() {}

const program = Effect.gen(function* () {
  // This is just here to indicate that our program does lots of things and
  // forks several long-living processes—an HTTP server, for example, and a
  // looping process that does things with a database. Details not really
  // important.
  //
  // In reality, we have many more services than just one, and many IPC handlers
  // that all rely on all of these services.
  yield* Effect.forkDaemon(
    Effect.repeat(
      Effect.gen(function* () {
        const randomData = yield* RandomData;
        const data = yield* randomData.getRandomData(16);
        yield* Effect.logInfo(`Random data: ${data}`);
      }),
      Schedule.fixed("1 second"),
    ),
  );

  ipcMain.handle("get-random-number", (_event, length: number) => {
    // This callback function *must* return a value—the Electron runtime returns
    // this to the renderer process.
    //
    // My question is, how do I get access to my `RandomData` service, and do
    // other effectful things here?
    //
    // The only API I can see for doing this would be to either:
    //
    // - Use `Effect.runPromise` to run a new program here, but that seems like
    //   it would be wasteful, as I'd be creating a new runtime for every
    //   invocation, which may happen on the order of hundreds of times per second.
    // - Do something weird where I return an unresolved promise from this
    //   function, and then emit that promise's `resolve` function via a stream
    //   that our program can then react to. This feels wonky and overly-complicated.

    // For now, I'll just return a string so that the end-to-end renderer<->main
    // communication is demonstrated.
    return "Hello from the main process!";
  });
}).pipe(
  Effect.provideService(
    RandomData,
    RandomData.of({
      getRandomData(length) {
        const data = crypto.getRandomValues(new Uint8Array(length));
        const hex = Array.from(data)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        return Effect.succeed(hex);
      },
    }),
  ),
);

// We use this controller to abort the program as soon as we know the app is
// going to quit.
const controller = new AbortController();
app.on("will-quit", () => {
  controller.abort();
});

Effect.runPromise(program, { signal: controller.signal });

// Most of the rest of this file can be ignored.

if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.webContents.openDevTools();
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
