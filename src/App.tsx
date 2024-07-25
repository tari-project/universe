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


setInterval(() => {
    // unlisten to the event
    invoke("status", {}).then((status) => {
        console.log("Status", status);
        document.getElementById("log-area").innerText = JSON.stringify(status, null, 2);

    }).catch((e) => {
        console.error("Could not get status", e)
    });
}, 1000);

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
      <h1>Tari Universe V1</h1>
      <pre id="log-area">

      </pre>


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
