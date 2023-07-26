<script setup lang="ts">
import { useCounterCommand } from '@/stores/countStore';
import { useCounter } from '@/stores';
const store = useCounter();
const counterCommand = useCounterCommand();
const countUp = () => counterCommand.increment();
</script>

<template>
  <div class="card">
    <button type="button" @click="countUp">count is {{ store.counter }}</button>
  </div>
</template>
