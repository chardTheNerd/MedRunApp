import React, { createContext, useContext, useMemo, useReducer } from 'react';

export function createBloc<State, Event>(
  name: string,
  reducer: (state: State, event: Event) => State,
  initialState: State,
) {
  const StateContext = createContext<State>(initialState);
  const DispatchContext = createContext<(event: Event) => void>(() => {
    throw new Error(`${name} used outside of its Provider.`);
  });

  function Provider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const stableDispatch = useMemo(() => dispatch, []);
    return (
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={stableDispatch}>{children}</DispatchContext.Provider>
      </StateContext.Provider>
    );
  }

  function useBlocState() {
    return useContext(StateContext);
  }

  function useBlocDispatch() {
    return useContext(DispatchContext);
  }

  return { Provider, useBlocState, useBlocDispatch };
}
