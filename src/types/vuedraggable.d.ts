import type { DefineComponent, VNodeChild } from 'vue'

type ItemSlotProps<T = unknown> = { element: T; index: number }

declare module 'vuedraggable' {
  const draggable: DefineComponent<
    {
      modelValue: unknown[]
      itemKey?: string | ((element: unknown) => string | number)
      animation?: number | string
      ghostClass?: string
    },
    {
      item: (props: ItemSlotProps<unknown>) => VNodeChild
      default: (props: ItemSlotProps<unknown>) => VNodeChild
    }
  >
  export default draggable
}
