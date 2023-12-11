import { defineStore } from 'pinia';
import { defineCommandableState } from './command';

export const TextState = defineCommandableState({
  id: 'text/state',
  state: () => ({
    text: '',
    name: '',
  }),
});

export const useText = defineStore('text', () => {
  const { defGet, defMut, defAct, defCmd, invalidateRecord } =
    TextState.useControllerContext();

  // getter
  const textGet = defGet(({ state }) => state.text);
  const isTextSameToName = defGet(
    ({ state, get }) => state.name == get(textGet),
  );
  const isSameText = defGet(
    ({ state }) =>
      (text: string) =>
        state.text === text,
  );

  // mutation
  const mutChangeText = defMut(({ state }, text: string) => {
    state.text = text;
  });
  const mutChangeName = defMut(({ state }, text: string) => {
    state.name = text;
  });
  const mutChangeTextAndName = defMut(
    ({ commit }, text: string, name: string) => {
      commit(mutChangeText, text);
      commit(mutChangeName, name);
    },
  );
  const mutChangeWhenTextSame = defMut(({ state, get }, text: string) => {
    // getterやreadonlyな関数はmutation内でも呼び出せる
    if (get(isSameText)) {
      state.text = text;
    }
  });

  // action
  const cmdChangeText = defCmd(({ recordCommit }, text: string) => {
    recordCommit(mutChangeText, text);
  });
  const actChangeText = invalidateRecord(cmdChangeText);
  const actChangeWhenTextSame = defAct(({ commit }, text: string) =>
    commit(mutChangeWhenTextSame, text),
  );

  const cmdChangeTextAndName = defCmd(
    ({ state, recordCommit }, text: string, name: string) => {
      // contextから降ってくるstateはreadonlyが付いている
      // state.text = text; // error

      // actionからmutationを叩く時はcommitを叩く
      recordCommit(mutChangeTextAndName, text, name);
      return state.text;
    },
  );

  return {
    isTextSameToName,
    actChangeWhenTextSame,
    cmdChangeTextAndName,
    cmdChangeText,
    actChangeText,
    textGet,
  };
});
