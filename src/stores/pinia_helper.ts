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

  // Getterを定義するための型ヘルパー
  public defGetRaw<Ret>(getter: GetterDefinition<S, Ret>) {
    return getter;
  }

  // Mutationを定義するための型ヘルパー
  public defMutRaw<Payloads extends unknown[]>(
    mutation: MutationDefinition<S, Payloads>,
  ) {
    return mutation;
  }

  public useContext() {
    // 一般に公開するreadonlyなstate
    const state = this.useState();
    // 書き込み可能なstate
    const _writableState = state as Store<Id, S>;

    // getterに必要なstateの依存を解決する関数
    const get = <Ret>(getter: GetterDefinition<S, Ret>): Ret => {
      return getter(state);
    };
    // getterを定義するための関数
    // getterに.getプロパティを追加し、computedに追加する
    const defGet = <Ret>(getter: GetterDefinition<S, Ret>): Getter<S, Ret> => {
      const getterObj = getter as Getter<S, Ret>;
      getterObj.get = computed(() => get(getter));
      return getterObj;
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

    // eslint-disable-next-line @typescript-eslint/ban-types
    const defAct = <A extends Function>(action: A): Action<A> => {
      return {
        dispatch: action,
      };
    };
    const asAct =
      <Payloads extends unknown[]>(mutation: MutationDefinition<S, Payloads>) =>
      (...payloads: Payloads) =>
        mutation(_writableState, ...payloads);
    const defMut = <Payloads extends unknown[]>(
      mutation: MutationDefinition<S, Payloads>,
    ) => {
      const mutationObj = mutation as Mutation<S, Payloads>;
      mutationObj.commit = asAct(mutation);
      return mutationObj;
    };
    const mapAsAct = <
      MutationTree extends Record<string, MutationDefinition<S, unknown[]>>,
    >(
      mutationTree: MutationTree,
    ) => mapAsAction(state, mutationTree);
    return {
      state,
      _writableState,
      defGet,
      defMut,
      defAct,
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
export type Getter<S extends StateTree, Ret> = GetterDefinition<S, Ret> & {
  get: ComputedRef<Ret>;
};
export type MutationDefinition<
  S extends StateTree,
  Payloads extends unknown[],
> = (draft: UnwrapRef<S>, ...payloads: Payloads) => void;
type Mutation<
  S extends StateTree,
  Payloads extends unknown[],
> = MutationDefinition<S, Payloads> & {
  commit: (...payloads: Payloads) => void;
};
// eslint-disable-next-line @typescript-eslint/ban-types
export type Action<A extends Function> = {
  dispatch: A;
};

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
