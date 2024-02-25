import { UnwrapRef, DeepReadonly, computed } from 'vue';
import { StateTree } from 'pinia';
import {
  USE_STATE,
  Fetch,
  ReadonlyFetch,
  Get,
  Getter,
  unwrapGetter,
  GetterContext,
  Dispatch,
  ActionContext,
  StateStore,
  Action,
  unwrapAction,
  Commit,
  Mutation,
  MutationContext,
  unwrapMutation,
  ComputedGet,
} from './interface';

export type StateStoreExecContext = {
  fetch: Fetch;
  get: Get;
  dispatch: Dispatch;
  computed: ComputedGet;
};
export function useStateStore(): StateStoreExecContext {
  const get = templateGet({});
  return {
    fetch: (state) => state[USE_STATE](),
    get,
    computed: (getter) => computed(() => get(getter)),
    dispatch: templateDispatch(),
  };
}

export function templateFetch(
  stateMap: Record<string, UnwrapRef<StateTree>>,
): Fetch {
  return function fetch<Id extends string, S extends StateTree>(
    state: StateStore<Id, S>,
  ): UnwrapRef<S> {
    if (!(state[USE_STATE].$id in stateMap)) {
      stateMap[state[USE_STATE].$id] = state[USE_STATE]();
    }
    return stateMap[state[USE_STATE].$id] as UnwrapRef<S>;
  };
}

export function templateReadonlyFetch(
  stateMap: Record<string, UnwrapRef<StateTree>>,
): ReadonlyFetch {
  return function fetch<Id extends string, S extends StateTree>(
    state: StateStore<Id, S>,
  ): DeepReadonly<UnwrapRef<S>> {
    if (!(state[USE_STATE].$id in stateMap)) {
      stateMap[state[USE_STATE].$id] = state[USE_STATE]();
    }
    return stateMap[state[USE_STATE].$id] as DeepReadonly<UnwrapRef<S>>;
  };
}

export function templateGet(
  stateMap: Record<string, UnwrapRef<StateTree>>,
): Get {
  return function get<Ret>(getter: Getter<Ret>) {
    const ctx: GetterContext = {
      fetch: templateReadonlyFetch(stateMap),
      get: templateGet(stateMap),
    };
    return unwrapGetter(getter)(ctx) as DeepReadonly<Ret>;
  };
}

export function templateCommit(
  stateMap: Record<string, UnwrapRef<StateTree>>,
): Commit {
  return function commit<Payloads extends unknown[]>(
    mutation: Mutation<Payloads>,
    ...payloads: Payloads
  ) {
    const ctx: MutationContext = {
      fetch: templateFetch(stateMap),
      get: templateGet(stateMap),
      commit: commit,
    };
    return unwrapMutation(mutation)(ctx, ...payloads);
  };
}

export function templateDispatch(
  stateMap: Record<string, UnwrapRef<StateTree>> = {},
): Dispatch {
  return function dispatch<Payloads extends unknown[], Ret>(
    action: Action<Payloads, Ret>,
    ...payloads: Payloads
  ) {
    const ctx: ActionContext = {
      fetch: templateReadonlyFetch(stateMap),
      get: templateGet(stateMap),
      commit: templateCommit(stateMap),
      dispatch: dispatch,
    };
    return unwrapAction(action)(ctx, ...payloads);
  };
}
