<script setup lang="ts">
import { useCounter, useCounterCommand } from '@/stores/countStore';
const store = useCounter();
const counterCommand = useCounterCommand();
const countUp = () => counterCommand.increment();
</script>

<template>
  <div class="card">
    <button type="button" @click="countUp">count is {{ store.counter }}</button>
  </div>
</template>
