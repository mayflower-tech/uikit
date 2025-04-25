import { computed, Signal } from '@preact/signals-core'
import { AllOptionalProperties, Properties, WithClasses, traverseProperties } from './properties/default.js'
import { createConditionalPropertyTranslator } from './utils.js'
import { EventHandlers, ThreePointerEvent } from './events.js'
import { addHandler } from './components/index.js'
import { DeepSignal } from 'deepsignal/core'

export type WithActive<T> = T & {
  active?: T
  onActiveChange?: (active: boolean) => void
}

export type ActiveEventHandlers = Pick<EventHandlers, 'onPointerDown' | 'onPointerUp' | 'onPointerLeave'>

export function addActiveHandlers(
  target: EventHandlers,
  style: (WithClasses<WithActive<Properties>> & EventHandlers) | undefined,
  properties: DeepSignal<WithClasses<WithActive<Properties>> & EventHandlers>,
  defaultProperties: DeepSignal<AllOptionalProperties>,
  activeSignal: Signal<Array<number>>,
): void {
  let activePropertiesExist = false

  traverseProperties(style, properties, defaultProperties, (p) => {
    if ('active' in p) {
      activePropertiesExist = true
    }
  })

  if (!activePropertiesExist && style?.onActiveChange == null && properties?.onActiveChange == null) {
    //no need to listen to hover
    activeSignal.value.length = 0
    return
  }
  const onLeave = ({ pointerId }: ThreePointerEvent) => {
    const newValue = activeSignal.value.filter((id) => id != pointerId)
    activeSignal.value = newValue
    if (newValue.length > 0) {
      return
    }
    properties?.onActiveChange?.(false)
    style?.onActiveChange?.(false)
  }
  addHandler('onPointerDown', target, ({ pointerId }) => {
    const newValue = [pointerId, ...activeSignal.peek()]
    activeSignal.value = newValue
    if (newValue.length != 1) {
      return
    }
    properties?.onActiveChange?.(true)
    style?.onActiveChange?.(true)
  })
  addHandler('onPointerUp', target, onLeave)
  addHandler('onPointerLeave', target, onLeave)
}
export function createActivePropertyTransfomers(activeSignal: Signal<Array<number>>) {
  return {
    active: createConditionalPropertyTranslator(() => activeSignal.value.length > 0),
  }
}

export const createActiveStuff =
  (activeSignal: Signal<Array<number>>) => (properties: WithActive<any>, key: string) => {
    return computed(() => {
      if (activeSignal.value.length > 0 && 'active' in properties) {
        return properties.active?.[key]
      }
    })
  }
