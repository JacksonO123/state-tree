import { createRoot, printRoot, useEffect, useState } from "./state";

function otherThing() {
  const [anotherState, setAnotherState] = useState("another thing");

  useEffect(() => {
    console.log(anotherState);
  }, []);
}

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

  createRoot(otherThing);
}

createRoot(thing);

// printRoot();
