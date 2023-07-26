<script setup lang="ts">
import { useTextCommand } from '@/stores/textStore';
import { useText } from '@/stores';
const store = useText();
const textCommand = useTextCommand();
const onChange = (evt: Event) => (evt.target instanceof HTMLInputElement) && textCommand.changeText(evt.target?.value ?? '');
</script>

<template>
  <div class="card">
    <p>{{ store.text }}</p>
    <input :value="store.text" @input="onChange" />
  </div>
</template>
