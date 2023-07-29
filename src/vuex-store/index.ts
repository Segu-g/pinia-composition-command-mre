import { InjectionKey } from 'vue';
import { createStore, Store, useStore as _useStore } from 'vuex';

export interface State {
  count: number;
}

export const key: InjectionKey<Store<State>> = Symbol();

export const vuexStore = createStore<State>({
  state() {
    return {
      count: 0,
    };
  },
  mutations: {
    increment(state) {
      state.count++;
    },
  },
});

export const useStore = () => _useStore(key);
