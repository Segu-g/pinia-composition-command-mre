import {
  defineStore,
  StoreDefinition,
  Store,
  StateTree,
  DefineStoreOptions,
} from 'pinia';
import { computed, ComputedRef, UnwrapRef, DeepReadonly } from 'vue';

/**
 * Stateを直接変更できないようにdefineStateでStoreとは別にStateを定義する.
 */
export const defineState = <Id extends string, S extends StateTree>(
  option: DefineStoreOptions<Id, S, Record<never, never>, Record<never, never>>,
) => {
  const useStore = defineStore(option);
  return new StateController(option.id, useStore);
};

export class StateController<Id extends string, S extends StateTree> {
  public readonly id: string;
  protected readonly _useStore: StateStoreDefinition<Id, S>;
  constructor(id: Id, useStore: StateStoreDefinition<Id, S>) {
    this.id = id;
    this._useStore = useStore;
  }

  public useState(...params: Parameters<StateStoreDefinition<Id, S>>) {
    return this._useStore(...params) as StateStore<Id, DeepReadonly<S>>;
  }

  public useWritableState(...params: Parameters<StateStoreDefinition<Id, S>>) {
    return this._useStore(...params);
  }

  public defGet<Ret>(getter: GetterDefinition<S, Ret>) {
    return getter;
  }

  public defMut<Payloads extends unknown[]>(
    mutation: MutationDefinition<S, Payloads>,
  ) {
    return mutation;
  }

  public useContext() {
    const state = this.useState();
    const _writableState = state as Store<Id, S>;
    const get = <Ret>(getter: GetterDefinition<S, Ret>): Ret => {
      return getter(state);
    };
    const getRef = <Ret>(
      getter: GetterDefinition<S, Ret>,
    ): ComputedRef<Ret> => {
      return computed(() => getter(state));
    };
    const mapGetRef = <
      GetterTree extends Record<string, GetterDefinition<S, unknown>>,
    >(
      getterTree: GetterTree,
    ) => mapGetterRef(state, getterTree);
    const asAct =
      <Payloads extends unknown[]>(mutation: MutationDefinition<S, Payloads>) =>
      (...payloads: Payloads) =>
        mutation(state, ...payloads);
    const mapAsAct = <
      MutationTree extends Record<string, MutationDefinition<S, unknown[]>>,
    >(
      mutationTree: MutationTree,
    ) => mapAsAction(state, mutationTree);
    return {
      /**
       * ssssss
       */
      state,
      _writableState,
      defGet: this.defGet,
      defMut: this.defMut,
      get,
      getRef,
      mapGetRef,
      asAct,
      mapAsAct,
    };
  }
}

export type StateStoreDefinition<
  Id extends string,
  S extends StateTree,
> = StoreDefinition<Id, S, Record<never, never>, Record<never, never>>;
export type StateStore<Id extends string, S extends StateTree> = Store<
  Id,
  S,
  Record<never, never>,
  Record<never, never>
>;
export type GetterDefinition<S extends StateTree, Ret> = (state: S) => Ret;
export type MutationDefinition<
  S extends StateTree,
  Payloads extends unknown[],
> = (state: UnwrapRef<S>, ...payloads: Payloads) => void;
export type MapGetterRef<
  S extends StateTree,
  GetterTree extends Record<string, GetterDefinition<S, unknown>>,
> = {
  [K in keyof GetterTree]: GetterTree[K] extends GetterDefinition<S, infer Ret>
    ? ComputedRef<Ret>
    : never;
};
export const mapGetterRef = <
  Id extends string,
  S extends StateTree,
  GetterTree extends Record<string, GetterDefinition<S, unknown>>,
>(
  state: StateStore<Id, S>,
  getterTree: GetterTree,
) => {
  return Object.fromEntries(
    Object.entries(getterTree).map(([key, getter]) => [
      key,
      computed(() => getter(state)),
    ]),
  ) as MapGetterRef<S, GetterTree>;
};
export type MapAsAction<
  S extends StateTree,
  MutationTree extends Record<string, MutationDefinition<S, unknown[]>>,
> = {
  [K in keyof MutationTree]: MutationTree[K] extends MutationDefinition<
    S,
    infer Payloads
  >
    ? (...payloads: Payloads) => void
    : never;
};
export const mapAsAction = <
  Id extends string,
  S extends StateTree,
  MutationTree extends Record<string, MutationDefinition<S, unknown[]>>,
>(
  store: StateStore<Id, S>,
  mutationTree: MutationTree,
) => {
  return Object.fromEntries(
    Object.entries(mutationTree).map(([key, mutation]) => [
      key,
      (...payloads: unknown[]) => mutation(store, payloads),
    ]),
  ) as MapAsAction<S, MutationTree>;
};
