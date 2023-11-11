<script setup lang="ts">
import { useText } from '@/stores';
const store = useText();
const onChange = (evt: Event) =>
  evt.target instanceof HTMLInputElement &&
  store.commandChangeText(evt.target?.value ?? '');
</script>

<template>
  <div class="card">
    <p>{{ store.state.text }}</p>
    <input :value="store.state.text" @input="onChange" />
  </div>
</template>
