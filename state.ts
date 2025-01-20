type EmptyFn = () => void;
type SetFnParam<T> = (oldValue: T) => T;

class State {
  states: any[];
  currentState: number;
  effectDeps: any[][];
  currentEffect: number;
  root: EmptyFn;

  constructor(root: EmptyFn) {
    this.root = root;
    this.states = [];
    this.currentState = 0;
    this.effectDeps = [];
    this.currentEffect = 0;
  }

  private resetIndices() {
    this.currentState = 0;
    this.currentEffect = 0;
  }

  getSetState<T>(val: T) {
    if (this.currentState < this.states.length) {
      const res = [this.currentState, this.states[this.currentState]] as const;
      this.currentState++;
      return res;
    }

    this.states.push(val);
    const res = [this.currentState, val] as const;
    return res;
  }

  setState<T>(index: number, value: T) {
    if (index >= this.states.length) return;
    this.states[index] = value;

    this.resetIndices();
    this.root();
  }

  effectExists() {
    return this.currentEffect < this.effectDeps.length;
  }

  consumeEffectDeps() {
    if (!this.effectExists()) return null;

    const res = [
      this.currentEffect,
      this.effectDeps[this.currentEffect],
    ] as const;
    this.currentEffect++;

    return res;
  }

  updateEffectDeps(index: number, deps: any[]) {
    if (index >= this.effectDeps.length) return;
    this.effectDeps[index] = deps;
  }

  createEffect(deps: any[]) {
    if (this.effectExists()) return;
    this.effectDeps.push(deps);
    this.currentEffect++;
  }
}

let state: State | null = null;

const getCurrentState = () => {
  if (!state) throw new Error("Expected state root");
  return state;
};

export function useState<T>(inputValue: T) {
  const state = getCurrentState();
  const [index, value] = state.getSetState(inputValue);

  const setFn = (newValue: T | SetFnParam<T>) => {
    if (typeof newValue === "function")
      newValue = (newValue as SetFnParam<T>)(value);
    state.setState(index, newValue);
  };

  return [value as T, setFn] as const;
}

export function useEffect(
  effect: () => (() => void) | void,
  dependencies: any[],
) {
  const state = getCurrentState();

  if (state.effectExists()) {
    const [index, oldDeps] = state.consumeEffectDeps()!;
    if (dependencies.length !== oldDeps.length) {
      throw new Error("Dependency array is different length");
    }

    if (dependencies.length === 0) return;

    let different = false;
    for (let i = 0; i < dependencies.length; i++) {
      if (dependencies[i] !== oldDeps[i]) {
        different = true;
        break;
      }
    }

    if (different) {
      state.updateEffectDeps(index, dependencies);
      effect();
    }
  } else {
    state.createEffect(dependencies);
    if (dependencies.length === 0) effect();
  }
}

export const createRoot = (fn: () => void) => {
  state = new State(fn);
  fn();
};

export const dumpState = () => {
  console.log(state);
};
