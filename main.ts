import { createRoot, dumpState, useEffect, useState } from "./state";

function thing() {
  const [state, setState] = useState("thing");

  useEffect(() => {
    console.log("new state:", state);
    setTimeout(() => {
      setState((prev) => prev + "a");
    }, 500);
  }, [state]);

  useEffect(() => {
    console.log("running");
    setState("epic state");
  }, []);
}

createRoot(thing);
