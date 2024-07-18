import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
// import { Command } from '@tauri-apps/api/shell';

import { listen } from '@tauri-apps/api/event'

// listen to the `click` event and get a function to remove the event listener
// there's also a `once` function that subscribes to an event and automatically unsubscribes the listener on the first event
const unlisten = await listen('message', (event) => {
    // event.event is the event name (useful if you want to use a single callback fn for multiple event types)
    // event.payload is the payload object
    console.log("some kind of event", event.event, event.payload);
})

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));

    // This must not be possible
      // const command = Command.sidecar('binaries/tari/esme/minotari_node')
      // const output = await command.execute()
  }

  async function startMining() {
      await invoke("start_mining", { }).then(() => {
          console.log("Mining started")

      }).catch((e) => {
            console.error("Could not start mining", e)
      });
  }

  async function stopMining() {
        await invoke("stop_mining", { }).then(() => {
            console.log("Mining stopped")

        }).catch((e) => {
                console.error("Could not stop mining", e)
        });
  }

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <button onClick={() => startMining()}>Start Mining</button>
        <button onClick = {() => stopMining()}>Stop Mining</button>


      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
