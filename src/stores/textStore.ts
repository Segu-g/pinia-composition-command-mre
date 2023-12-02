import { defineStore, storeToRefs } from 'pinia';

import { defineCommandableState } from './command';

export const TextState = defineCommandableState({
  id: 'text/state',
  state: () => ({
    text: '',
    name: '',
  }),
});

export const useText = defineStore('text', () => {
  const { state, defGet, defMut, defAct, asCmd } = TextState.useContext();

  // getter
  const textGet = defGet((state) => state.text);
  const isTextSameToName = defGet((state) => state.name == textGet.func(state));
  const isSameText = defGet((state) => (text: string) => state.text === text);

  // mutation
  const changeTextMut = defMut((state, text: string) => {
    state.text = text;
  });
  const changeNameMut = defMut((state, text: string) => {
    state.name = text;
  });
  const changeTextAndNameMut = defMut((state, text: string, name: string) => {
    // mutationからmutaitonを叩く時は.funcから直接関数として叩く
    changeTextMut.func(state, text);
    changeNameMut.func(state, name);
    // TODO: 以下はESLintでエラーになって欲しい
    // changeNameMut.commit(name);
  });
  const changeWhenTextSameMut = defMut((state, text: string) => {
    // getterやreadonlyな関数はmutation内でも呼び出せる
    if (isSameText.func(state)) {
      state.text = text;
    }
  });

  // action
  const changeTextAndName = defAct((text: string, name: string) => {
    // useContextから降ってくるstateはreadonlyが付いている
    // state.text = text; // error

    // readonlyなstateを代入できないようにMutationのStateにBrandが付いている
    // changeTextAndNameMut.func(state, text, name); // error

    // actionからmutationを叩く時はcommitを叩く
    changeTextAndNameMut.commit(text, name);

    // action内ではstateは直接呼んでも.getから呼んでも良い
    return textGet.get() == textGet.func(state);
  });
  // command
  const commandChangeText = asCmd(changeTextMut.func);

  return {
    state: storeToRefs(state),
    changeTextMut,
    changeNameMut,
    changeTextAndName,
    changeWhenTextSameMut,
    commandChangeText,
    textGet,
    isTextSameToName,
  };
});
