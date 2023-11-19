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
  const isTextSameToName = defGet((state) => state.name == textGet(state));
  const isSameText = defGet((state) => (text: string) => state.text === text);

  // mutation
  const changeTextMut = defMut((state, text: string) => {
    state.text = text;
  });
  const changeNameMut = defMut((state, text: string) => {
    state.name = text;
  });
  const changeTextAndNameMut = defMut((state, text: string, name: string) => {
    changeTextMut(state, text);
    changeNameMut(state, name);
  });
  const changeWhenTextSameMut = defMut((state, text: string) => {
    if (isSameText(state)) {
      state.text = text;
    }
  });

  // action
  const changeTextAndName = defAct((text: string, name: string) => {
    // useContextから降ってくるstateはreadonlyが付いている
    // state.text = text; // error

    // readonlyなstateを代入できないようにMutationのStateにBrandが付いている
    // changeTextAndNameMut(state, text, name); // error

    // actionからmutationを叩く時はcommitを叩く
    changeTextAndNameMut.commit(text, name);

    // stateは直接呼んでも.getから呼んでも良い
    return textGet.get.value == textGet(state);
  });
  // command
  const commandChangeText = asCmd(changeTextMut);

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
