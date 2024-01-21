import { DeepReadonly, UnwrapRef } from 'vue';
import { defineStore, DefineStoreOptions, StateTree } from 'pinia';
import {
  USE_STATE,
  StateStore,
  Action,
  Getter,
  Mutation,
  GetterContext,
  MutationContext,
  ActionContext,
} from './interface';

/**
 * Vuexのstateに相当するpiniaのstoreを定義する関数
 * Stateを直接変更できないようにdefineStateでStoreとは別にStateを定義する.
 */
export function defineState<Id extends string, S extends StateTree>(
  options: DefineStoreOptions<
    Id,
    S,
    Record<never, never>,
    Record<never, never>
  >,
): StateStore<Id, S> {
  return {
    [USE_STATE]: defineStore(options),
  };
}

export type StateContext = {
  defGet: typeof Getter;
  defMut: typeof Mutation;
  defAct: typeof Action;
};
export type SingleStateContext<S extends StateTree> = {
  defGet: <Ret>(
    getter: (ctx: GetterContext & { state: DeepReadonly<UnwrapRef<S>> }) => Ret,
  ) => Getter<Ret>;
  defMut: <Payloads extends unknown[]>(
    mutation: (
      ctx: MutationContext & { state: UnwrapRef<S> },
      ...payloads: Payloads
    ) => undefined,
  ) => Mutation<Payloads>;
  defAct: <Ret, Payloads extends unknown[]>(
    action: (
      ctx: ActionContext & { state: DeepReadonly<UnwrapRef<S>> },
      ...payloads: Payloads
    ) => Ret,
  ) => Action<Payloads, Ret>;
};
export function useStateContext(): StateContext {
  return {
    defGet: Getter,
    defMut: Mutation,
    defAct: Action,
  };
}

export function useSingleStateContext<Id extends string, S extends StateTree>(
  state: StateStore<Id, S>,
): SingleStateContext<S> {
  return {
    defGet: (getter) =>
      Getter((ctx, ...payloads) =>
        getter({ ...ctx, state: ctx.fetch(state) }, ...payloads),
      ),
    defMut: (mutation) =>
      Mutation((ctx, ...payloads) =>
        mutation({ ...ctx, state: ctx.fetch(state) }, ...payloads),
      ),
    defAct: (action) =>
      Action((ctx, ...payloads) =>
        action(
          {
            ...ctx,
            state: ctx.fetch(state),
          },
          ...payloads,
        ),
      ),
  };
}
