<script setup lang="ts">
import Password from 'primevue/password'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Password :feedback="false" toggle-mask v-bind="$attrs" />
</template>
