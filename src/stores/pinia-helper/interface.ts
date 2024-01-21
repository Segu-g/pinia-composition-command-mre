import { StateTree, StoreDefinition } from 'pinia';
import { UnwrapRef, DeepReadonly } from 'vue';

const GETTER: unique symbol = Symbol();
export type Getter<Ret> = {
  [GETTER]: GetterDefinition<Ret>;
};
export function Getter<Ret>(getter: GetterDefinition<Ret>): Getter<Ret> {
  return { [GETTER]: getter };
}
export function unwrapGetter<Ret>(getter: Getter<Ret>): GetterDefinition<Ret> {
  return getter[GETTER];
}

const MUTATION: unique symbol = Symbol();
export type Mutation<Payloads extends unknown[]> = {
  [MUTATION]: MutationDefinition<Payloads>;
};
export function Mutation<Payloads extends unknown[]>(
  mutation: MutationDefinition<Payloads>,
) {
  return { [MUTATION]: mutation };
}
export function unwrapMutation<Payloads extends unknown[]>(
  mutation: Mutation<Payloads>,
): MutationDefinition<Payloads> {
  return mutation[MUTATION];
}

const ACTION: unique symbol = Symbol();
export type Action<Payloads extends unknown[], Ret> = {
  [ACTION]: ActionDefinition<Payloads, Ret>;
};
export function Action<Payloads extends unknown[], Ret>(
  action: ActionDefinition<Payloads, Ret>,
): Action<Payloads, Ret> {
  return action as unknown as Action<Payloads, Ret>;
}
export function unwrapAction<Payloads extends unknown[], Ret>(
  action: Action<Payloads, Ret>,
): ActionDefinition<Payloads, Ret> {
  return action[ACTION];
}

export const USE_STATE: unique symbol = Symbol();
export type StateStore<Id extends string, S extends StateTree> = {
  [USE_STATE]: StoreDefinition<
    Id,
    S,
    Record<never, never>,
    Record<never, never>
  >;
};

export type Fetch = <Id extends string, S extends StateTree>(
  stateStore: StateStore<Id, S>,
) => UnwrapRef<S>;
export type ReadonlyFetch = <Id extends string, S extends StateTree>(
  stateStore: StateStore<Id, S>,
) => DeepReadonly<UnwrapRef<S>>;
export type Get = <Ret>(getter: Getter<Ret>) => DeepReadonly<Ret>;
export type Commit = <Payloads extends unknown[]>(
  mutation: Mutation<Payloads>,
  ...payloads: Payloads
) => void;
export type Dispatch = <Payloads extends unknown[], Ret>(
  action: Action<Payloads, Ret>,
  ...payloads: Payloads
) => Ret;

export type GetterContext = {
  /**
   * `StateStore`から`state` (readonly)を取り出す関数
   */
  fetch: ReadonlyFetch;
  /**
   * 他のgetterを呼ぶための関数
   **/
  get: Get;
};
/**
 * Getterを実態を定義する為の関数
 */
export type GetterDefinition<Ret> = (
  /**
   * `state`, `getter`を参照する為のコンテキストが渡される引数
   */
  context: GetterContext,
) => Ret;

// Mutation
export type MutationContext = {
  /**
   * `StateStore`から`state` (writable)を取り出す関数
   */
  fetch: Fetch;
  /**
   * getterを呼ぶための関数
   **/
  get: Get;
  /**
   * 他のmutationを呼ぶための関数
   */
  commit: Commit;
};
export type MutationDefinition<Payloads extends unknown[]> = (
  // `state`, `getter`, `mutation`を参照する為のコンテキストが渡される引数
  context: MutationContext,
  // Mutationが持つ引数
  ...payloads: Payloads
) => undefined;

// Action
export type ActionContext = {
  /**
   * `StateStore`から`state` (readonly)を取り出す関数
   */
  fetch: ReadonlyFetch;
  /**
   * getterを呼ぶための関数
   **/
  get: Get;
  /**
   * mutationを呼ぶための関数
   */
  commit: Commit;
  /**
   * 他のactionを呼ぶための関数
   */
  dispatch: Dispatch;
};
export type ActionDefinition<Payloads extends unknown[], Ret> = (
  // `state`, `getter`, `mutation`, `action`を参照する為のコンテキストが渡される引数
  context: ActionContext,
  // actionの引数
  ...payloads: Payloads
) => Ret;
