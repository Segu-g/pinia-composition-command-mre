import { defineStore } from 'pinia';
import { ref } from 'vue';

import { defineCommand } from './command';

export const useCounter = defineStore('counter', () => {
  const counter = ref(0);
  const increment = () => (counter.value += 1);
  return {
    counter,
    increment,
  };
});

export const useCounterCommand = defineStore('counterCommand', () => {
  const counter = useCounter();
  const increment = defineCommand({ counter }, ({ counter }) => {
    counter.counter += 1;
  });
  return { increment };
});
