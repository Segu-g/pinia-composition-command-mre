import { defineStore } from 'pinia';
import { ref } from 'vue';

import { defineCommand, useCommand } from './command';

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
  const commandStore = useCommand();
  const increment = defineCommand(commandStore, { counter }, ({ counter }) => {
    counter.counter += 1;
  });
  return { increment };
});
