type EmptyFn = () => void;
type SetFnParam<T> = (oldValue: T) => T;
type EffectFn = () => (() => void) | void;

class State {
  private states: any[];
  private currentState: number;
  private effectDeps: any[][];
  private currentEffect: number;
  private children: State[];
  private root: EmptyFn;
  private parent: State | null;

  constructor(root: EmptyFn) {
    this.root = root;
    this.states = [];
    this.currentState = 0;
    this.effectDeps = [];
    this.currentEffect = 0;
    this.children = [];
    this.parent = null;
  }

  setParent(state: State | null) {
    this.parent = state;
  }

  getParent() {
    return this.parent;
  }

  addChild(state: State) {
    this.children.push(state);
  }

  private resetIndices() {
    this.currentState = 0;
    this.currentEffect = 0;
  }

  private clearChildren() {
    this.children = [];
    this.children.forEach((child) => child.setParent(null));
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
    this.clearChildren();
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

let rootState: State | null = null;
let currentState: State | null = null;

const getRootStateOrNull = () => {
  return rootState;
};

const getRootState = () => {
  if (!rootState) throw new Error("Expected state root");
  return rootState;
};

export function useState<T>(inputValue: T) {
  const state = getRootState();
  const [index, value] = state.getSetState(inputValue);

  const setFn = (newValue: T | SetFnParam<T>) => {
    if (typeof newValue === "function")
      newValue = (newValue as SetFnParam<T>)(value);
    state.setState(index, newValue);
  };

  return [value as T, setFn] as const;
}

export function useEffect(effect: EffectFn, dependencies: any[]) {
  if (!currentState) return;

  if (currentState.effectExists()) {
    const [index, oldDeps] = currentState.consumeEffectDeps()!;
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
      currentState.updateEffectDeps(index, dependencies);
      effect();
    }
  } else {
    currentState.createEffect(dependencies);
    if (dependencies.length === 0) effect();
  }
}

export const createRoot = (fn: () => void) => {
  const newState = new State(fn);

  if (!rootState) rootState = newState;

  if (!currentState) {
    currentState = newState;
  } else {
    newState.setParent(currentState);
    currentState.addChild(newState);
    currentState = newState;
  }

  fn();

  const parent = currentState.getParent();
  if (parent) currentState = parent;
};

export const printRoot = () => {
  console.log(getRootStateOrNull());
};
