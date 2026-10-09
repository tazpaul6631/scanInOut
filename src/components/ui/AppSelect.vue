<script setup lang="ts">
import { ref } from 'vue'
import Select from 'primevue/select'

defineOptions({ inheritAttrs: false })

const select = ref<InstanceType<typeof Select>>()

defineExpose({
  hide: () => select.value?.hide?.(),
})
</script>

<template>
  <Select ref="select" v-bind="$attrs">
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </Select>
</template>
