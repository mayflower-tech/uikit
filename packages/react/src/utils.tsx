import { Signal, batch, effect, signal } from '@preact/signals-core'
import { EventHandlers, ThreeEvent } from '@react-three/fiber/dist/declarations/src/core/events'
import { ReactNode, forwardRef, useEffect, useMemo, useState } from 'react'
import { Object3D } from 'three'
import { useDefaultProperties } from './default.js'
import { AllOptionalProperties } from '@pmndrs/uikit/internals'
import { Sign } from 'crypto'

export type R3FEventMap = {
  mouse: ThreeEvent<MouseEvent>
  wheel: ThreeEvent<WheelEvent>
  pointer: ThreeEvent<PointerEvent>
}

export const AddHandlers = forwardRef<
  Object3D,
  {
    handlers: Signal<EventHandlers>
    children?: ReactNode
  }
>(({ handlers: handlersSignal, children }, ref) => {
  const [handlers, setHandlers] = useState(() => handlersSignal.peek())
  useEffect(
    () =>
      effect(() => {
        const handlers = handlersSignal.value
        const ref = void setTimeout(() => setHandlers(handlers), 0)
        return () => clearTimeout(ref)
      }),
    [handlersSignal],
  )
  return (
    <object3D ref={ref} matrixAutoUpdate={false} {...handlers}>
      {children}
    </object3D>
  )
})

const eventHandlerKeys: Array<keyof EventHandlers> = [
  'onClick',
  'onContextMenu',
  'onDoubleClick',
  'onPointerCancel',
  'onPointerDown',
  'onPointerEnter',
  'onPointerLeave',
  'onPointerMove',
  'onPointerOut',
  'onPointerOver',
  'onPointerUp',
  'onWheel',
]

export function usePropertySignals<T>(properties: T) {
  const propertySignals = useMemo(
    () => ({
      style: signal<T | undefined>(undefined),
      properties: signal<T | undefined>(undefined as any),
      default: signal<AllOptionalProperties | undefined>(undefined),
      handlers: (() => {
        const hashmap = {} as Record<keyof EventHandlers, Signal<EventHandlers[keyof EventHandlers]>>
        for (const key of eventHandlerKeys) {
          hashmap[key] = signal(undefined)
        }
        return hashmap
      })(),
      hoverProps: signal(undefined),
      activeProps: signal(undefined),
    }),
    [],
  )
  const defaultProperties = useDefaultProperties()
  batch(() => {
    propertySignals.properties.value = properties
    propertySignals.default.value = defaultProperties
    for (const key of eventHandlerKeys) {
      // @ts-expect-error
      const handler = properties[key]
      propertySignals.handlers[key].value = handler
    }
    // @ts-expect-error
    propertySignals.hoverProps.value = {
      // @ts-expect-error
      hover: properties.hover,
      // @ts-expect-error
      cursor: properties.cursor,
      // @ts-expect-error
      onHoverChange: properties.onHoverChange,
      // @ts-expect-error
      classes: properties.classes,
    }
    // @ts-expect-error
    propertySignals.activeProps.value = {
      // @ts-expect-error
      active: properties.active,
      // @ts-expect-error
      onActiveChange: properties.onActiveChange,
      // @ts-expect-error
      classes: properties.classes,
    }
  })
  return propertySignals
}
