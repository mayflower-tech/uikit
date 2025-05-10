import { computed, Signal } from '@preact/signals-core'
import { createConditionalPropertyTranslator } from './utils.js'
import { PropertyTransformers } from './properties/merged.js'
import { EventHandlers } from './events.js'
import { addHandler } from './components/index.js'
import { AllOptionalProperties, traverseProperties } from './properties/index.js'
import { DeepSignal } from 'deepsignal/core'

export type WithHover<T> = T & {
  cursor?: string
  hover?: T
  onHoverChange?: (hover: boolean) => void
}
export type HoverEventHandlers = Pick<EventHandlers, 'onPointerOver' | 'onPointerOut'>

export function setupCursorCleanup(hoveredSignal: Signal<Array<number>>, abortSignal: AbortSignal) {
  //cleanup cursor effect
  abortSignal.addEventListener('abort', () => unsetCursorType(hoveredSignal))
}

export function addHoverHandlers(
  target: EventHandlers,
  style: WithHover<{}> | undefined,
  properties: DeepSignal<WithHover<{}>>,
  defaultProperties: DeepSignal<AllOptionalProperties>,
  hoveredSignal: Signal<Array<number>>,
  defaultCursor?: string,
): void {
  let hoverPropertiesExist = false
  traverseProperties(style, properties, defaultProperties, (p) => {
    if ('hover' in p) {
      hoverPropertiesExist = true
    }
  })

  const cursor = style?.cursor ?? properties?.cursor ?? defaultCursor
  if (!hoverPropertiesExist && style?.onHoverChange == null && properties?.onHoverChange == null && cursor == null) {
    //no need to listen to hover
    hoveredSignal.value.length = 0
    return
  }
  addHandler('onPointerOver', target, ({ pointerId }) => {
    const newValue = [pointerId, ...hoveredSignal.peek()]
    hoveredSignal.value = newValue
    if (newValue.length === 1) {
      properties?.onHoverChange?.(true)
      style?.onHoverChange?.(true)
    }
    if (cursor != null) {
      setCursorType(hoveredSignal, cursor)
    }
  })
  addHandler('onPointerOut', target, ({ pointerId }) => {
    const newValue = hoveredSignal.peek().filter((id) => id != pointerId)
    hoveredSignal.value = newValue
    if (newValue.length === 0) {
      properties?.onHoverChange?.(false)
      style?.onHoverChange?.(false)
    }
    unsetCursorType(hoveredSignal)
  })
}

export function createHoverPropertyTransformers(hoveredSignal: Signal<Array<number>>): PropertyTransformers {
  return {
    hover: createConditionalPropertyTranslator(() => hoveredSignal.value.length > 0),
  }
}

const cursorRefStack: Array<unknown> = []
const cursorTypeStack: Array<string> = []

export function setCursorType(ref: unknown, type: string): void {
  cursorRefStack.push(ref)
  cursorTypeStack.push(type)
  document.body.style.cursor = type
}

export function unsetCursorType(ref: unknown): void {
  const index = cursorRefStack.indexOf(ref)
  if (index == -1) {
    return
  }
  cursorRefStack.splice(index, 1)
  cursorTypeStack.splice(index, 1)
  document.body.style.cursor = cursorTypeStack[cursorTypeStack.length - 1] ?? 'default'
}

export const createHoveredStuff =
  (hoveredSignal: Signal<Array<number>>) => (properties: WithHover<any>, key: string) => {
    return computed(() => {
      if (hoveredSignal.value.length > 0 && 'hover' in properties) {
        return properties.hover?.[key]
      }
    })
  }
