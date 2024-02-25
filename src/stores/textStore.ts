import { defineStore } from 'pinia';
import {
  defineCommandableStateStore,
  useSingleCommandContext,
} from './pinia-helper';

export const TextState = defineCommandableStateStore({
  id: 'text/state',
  state: () => ({
    text: '',
    name: '',
  }),
});

export const useText = defineStore('text', () => {
  const { defMut, defCmd } = useSingleCommandContext(TextState);
  const changeTextMut = defMut(({ state }, text: string) => {
    state.text = text;
  });
  const changeTextCmd = defCmd(({ record }, text: string) => {
    record(changeTextMut, text);
  });
  return { changeTextCmd };
});
