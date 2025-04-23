import { Signal, computed } from '@preact/signals-core'
import { MergedProperties } from './merged.js'
import { readReactive } from '../utils.js'
import { DeepSignal } from 'deepsignal'

export function computedInheritableProperty<T>(
  propertiesSignal: Signal<MergedProperties>,
  key: string,
  defaultValue: T,
): Signal<T> {
  return computed(() => propertiesSignal.value.read(key, defaultValue))
}

export function computedNonInheritableProperty<T>(
  style: Signal<Record<string, unknown> | undefined>,
  properties: DeepSignal<Record<string, unknown>>,
  key: string,
  defaultValue: T,
): Signal<T> {
  return computed(() => readReactive(style.value?.[key] as T) ?? readReactive(properties[key] as T) ?? defaultValue)
}
