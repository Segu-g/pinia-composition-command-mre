import { defineStore } from 'pinia';
import {
  defineCommandableStateStore,
  useSingleCommandContext,
} from './pinia-helper';

const CountState = defineCommandableStateStore({
  id: 'count/state',
  state: () => ({
    counter: 0,
  }),
});

export const useCount = defineStore('count', () => {
  const { defGet, defMut, defCmd } = useSingleCommandContext(CountState);

  const getCount = defGet(({ state }) => {
    return state.counter;
  });
  const mutIncrement = defMut(({ state }) => {
    state.counter += 1;
  });
  const cmdIncrement = defCmd(({ record }) => {
    record(mutIncrement);
  });

  return {
    getCount,
    cmdIncrement,
  };
});
