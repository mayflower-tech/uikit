import { Signal, ReadonlySignal, computed } from '@preact/signals-core'
import { MergedProperties } from './merged.js'
import { readReactive } from '../utils.js'
import { DeepSignal } from 'deepsignal/core'
import { ReadonlyDeepSignalObject } from '../internals.js'

export function computedInheritableProperty<T, K extends string = string>(
  propertiesSignal: ReadonlyDeepSignalObject<Partial<Record<K, unknown>>>,
  key: K,
  defaultValue: T,
): ReadonlySignal<T> {
  // @ts-expect-error
  return computed(() => propertiesSignal[key] ?? defaultValue)
}

export function computedNonInheritableProperty<T>(
  style: Signal<Record<string, unknown> | undefined>,
  properties: DeepSignal<Record<string, unknown>>,
  key: string,
  defaultValue: T,
): Signal<T> {
  return computed(() => readReactive(style.value?.[key] as T) ?? readReactive(properties[key] as T) ?? defaultValue)
}
