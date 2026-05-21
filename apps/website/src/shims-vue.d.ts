/* eslint-disable */
// https://github.com/vuejs/vue-cli/blob/b1772cadd2efca7fdd218f58d788d12e4132d62f/packages/%40vue/cli-plugin-typescript/generator/template-vue3/src/shims-vue.d.ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
