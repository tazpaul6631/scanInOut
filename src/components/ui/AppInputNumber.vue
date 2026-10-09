<script setup lang="ts">
import InputNumber from 'primevue/inputnumber'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <InputNumber variant="on" v-bind="$attrs">
    <slot />
  </InputNumber>
</template>