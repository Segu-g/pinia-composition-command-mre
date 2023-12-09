import {
  defineStore,
  Store,
  DefineStoreOptions,
  StateTree,
  StoreDefinition,
} from 'pinia';
import { UnwrapRef, DeepReadonly } from 'vue';

// Vuexのstateに相当するpiniaのstoreを定義する関数
export function defineState<Id extends string, S extends StateTree>(
  options: DefineStoreOptions<
    Id,
    S,
    Record<never, never>,
    Record<never, never>
  >,
) {
  return new StateController(options.id, defineStore(options));
}

/**
 * Stateに対してController(mutation, action)を用いた操作を定義するための関数
 */
export class StateController<Id extends string, S extends StateTree> {
  public readonly id: string;
  protected readonly _useStore: StateStoreDefinition<Id, S>;
  constructor(id: Id, useStore: StateStoreDefinition<Id, S>) {
    this.id = id;
    this._useStore = useStore;
  }

  /**
   * getter, mutation, actionを定義するためのcontext (defGet, defMut, defAct) を得る関数
   * */
  public useControllerContext(...args: Parameters<typeof this._useStore>) {
    const store = this._useStore(...args);
    return {
      defGet: <Ret>(
        getterDef: GetterDefinition<Id, S, Ret>,
      ): Getter<Id, S, Ret> => ({
        [GETTER_TAG]: getterDef,
        [STORE]: store,
      }),
      defMut: <Payloads extends unknown[]>(
        mutationDef: MutationDefinition<Id, S, Payloads>,
      ): Mutation<Id, S, Payloads> => ({
        [MUTATION_TAG]: mutationDef,
      }),
      defAct: <Payloads extends unknown[], Ret>(
        actionDef: ActionDefinition<Id, S, Payloads, Ret>,
      ): Action<Id, S, Payloads, Ret> => ({
        [ACTION_TAG]: actionDef,
        [STORE]: store,
      }),
    };
  }

  public useState(...args: Parameters<typeof this._useStore>) {
    const store = this._useStore(...args);
    return store as StateStore<Id, DeepReadonly<S>>;
  }
}

// symbol for hiding
export const GETTER_TAG: unique symbol = Symbol();
export const MUTATION_TAG: unique symbol = Symbol();
export const ACTION_TAG: unique symbol = Symbol();
export const STORE: unique symbol = Symbol();

// Context functions
export type Get<Id extends string, S extends StateTree> = <Ret>(
  getter: Getter<Id, S, Ret>,
) => Ret;
export type Commit<Id extends string, S extends StateTree> = <
  Payloads extends unknown[],
>(
  mutation: Mutation<Id, S, Payloads>,
  ...payloads: Payloads
) => void;
export type Dispatch = <
  Id extends string,
  S extends StateTree,
  Payloads extends unknown[],
  Ret,
>(
  action: Action<Id, S, Payloads, Ret>,
  ...payloads: Payloads
) => Ret;

// Getter
export type GetterContext<Id extends string, S extends StateTree> = {
  state: DeepReadonly<UnwrapRef<S>>;
  get: Get<Id, S>;
};
export type GetterDefinition<Id extends string, S extends StateTree, Ret> = (
  context: GetterContext<Id, S>,
) => Ret;
export type Getter<Id extends string, S extends StateTree, Ret> = {
  [GETTER_TAG]: GetterDefinition<Id, S, Ret>;
  [STORE]: Store<Id, S>;
};

// Mutation
export type MutationContext<Id extends string, S extends StateTree> = {
  state: UnwrapRef<S>;
  get: Get<Id, S>;
  commit: Commit<Id, S>;
};
export type MutationDefinition<
  Id extends string,
  S extends StateTree,
  Payloads extends unknown[],
> = (context: MutationContext<Id, S>, ...payloads: Payloads) => undefined;
export type Mutation<
  Id extends string,
  S extends StateTree,
  Payloads extends unknown[],
> = {
  [MUTATION_TAG]: MutationDefinition<Id, S, Payloads>;
};

// Action
export type ActionContext<Id extends string, S extends StateTree> = {
  state: DeepReadonly<UnwrapRef<S>>;
  get: Get<Id, S>;
  commit: Commit<Id, S>;
  dispatch: Dispatch;
};
export type ActionDefinition<
  Id extends string,
  S extends StateTree,
  Payloads extends unknown[],
  Ret,
> = (context: ActionContext<Id, S>, ...payloads: Payloads) => Ret;
export type Action<
  Id extends string,
  S extends StateTree,
  Payloads extends unknown[],
  Ret,
> = {
  [ACTION_TAG]: ActionDefinition<Id, S, Payloads, Ret>;
  [STORE]: Store<Id, S>;
};

// state only store or stateDefinition type
type StateStoreDefinition<
  Id extends string,
  S extends StateTree,
> = StoreDefinition<Id, S, Record<never, never>, Record<never, never>>;
type StateStore<Id extends string, S extends StateTree> = Store<
  Id,
  S,
  Record<never, never>,
  Record<never, never>
>;
