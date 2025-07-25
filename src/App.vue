<template>
  <div id="app">
    <router-view />
    <OOBE />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

// 异步加载OOBE组件，避免初始加载时的性能问题
const OOBE = defineAsyncComponent(() => import('@/components/oobe/OOBE.vue'))

export default {
  name: 'App',
  components: {
    OOBE
  }
}
</script>

<style>
#app {
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  overflow: hidden;
}
</style>