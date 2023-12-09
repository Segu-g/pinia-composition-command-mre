<script setup lang="ts"></script>

<template>
  <div>
    <button type="button" :disabled="!false" @click="console.log">UNDO</button>
    <button type="button" :disabled="!false" @click="console.log">REDO</button>
  </div>
</template>
