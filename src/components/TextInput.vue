<script setup lang="ts">
import { useText } from '@/stores';
const store = useText();
const onChange = (evt: Event) =>
  evt.target instanceof HTMLInputElement &&
  store.commandChangeText.dispatch(evt.target?.value ?? '');
</script>

<template>
  <div class="card">
    <p>{{ store.textGet.get }}</p>
    <input :value="store.textGet.get" @input="onChange" />
  </div>
</template>
