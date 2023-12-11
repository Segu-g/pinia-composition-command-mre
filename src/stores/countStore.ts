import { defineStore } from 'pinia';
import { defineCommandableState } from './command';

const CountState = defineCommandableState({
  id: 'count/state',
  state: () => ({
    counter: 0,
  }),
});

export const useCount = defineStore('count', () => {
  const { defGet, defMut, defCmd, invalidateRecord } =
    CountState.useControllerContext();

  const getCount = defGet(({ state }) => {
    return state.counter;
  });
  const mutIncrement = defMut(({ state }) => {
    state.counter += 1;
  });
  const cmdIncrement = defCmd(({ recordCommit }) => {
    recordCommit(mutIncrement);
  });
  const actIncrement = invalidateRecord(cmdIncrement);

  return {
    getCount,
    cmdIncrement,
    actIncrement,
  };
});
