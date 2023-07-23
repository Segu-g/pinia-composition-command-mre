<script setup lang="ts">
import { useText, useTextCommand } from '@/stores/textStore';
const store = useText();
const textCommand = useTextCommand();
const onChange = (evt: InputEvent) => textCommand.changeText(evt.data ?? '');
</script>

<template>
  <div class="card">
    <input :value="store.text" @input="onChange as unknown" />
  </div>
</template>
