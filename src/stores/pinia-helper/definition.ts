import { defineStore, DefineStoreOptions, StateTree } from 'pinia';
import {
  USE_STATE,
  StateStore,
  Action,
  Getter,
  Mutation,
  defSingleStateGetter,
  defSingleStateMutaiton,
  defSingleStateAction,
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

export function useStateContext() {
  return {
    defGet: Getter,
    defMut: Mutation,
    defAct: Action,
  };
}

export function useSingleStateContext<Id extends string, S extends StateTree>(
  state: StateStore<Id, S>,
) {
  return {
    defGet: defSingleStateGetter(state),
    defMut: defSingleStateMutaiton(state),
    defAct: defSingleStateAction(state),
  };
}
