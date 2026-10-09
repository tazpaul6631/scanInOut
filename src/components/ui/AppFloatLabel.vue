<script setup lang="ts">
import FloatLabel from 'primevue/floatlabel'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <FloatLabel variant="on" v-bind="$attrs">
    <slot />
  </FloatLabel>
</template>
