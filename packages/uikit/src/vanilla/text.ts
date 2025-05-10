import { AllOptionalProperties } from '../properties/default.js'
import { createParentContextSignal, setupParentContextSignal, bindHandlers, Component } from './utils.js'
import { ReadonlySignal, Signal, effect, signal, untracked } from '@preact/signals-core'
import { DeepSignal, deepSignal } from 'deepsignal/core'
import { TextProperties, createTextState, setupText } from '../components/text.js'
import { MergedProperties } from '../properties/index.js'
import { ThreeEventMap } from '../events.js'
import { ReadonlyDeepSignalObject } from '../internals.js'

export class Text<T = {}, EM extends ThreeEventMap = ThreeEventMap> extends Component<T> {
  private mergedProperties?: ReadonlyDeepSignalObject<TextProperties<EM>>
  private readonly styleSignal: Signal<TextProperties<EM> | undefined> = signal(undefined)
  private readonly propertiesSignal: DeepSignal<TextProperties<EM>>
  private readonly defaultPropertiesSignal: DeepSignal<AllOptionalProperties>
  private readonly textSignal: Signal<unknown | Signal<unknown> | Array<unknown | Signal<unknown>>>
  private readonly parentContextSignal = createParentContextSignal()
  private readonly unsubscribe: () => void

  public internals!: ReturnType<typeof createTextState>

  constructor(
    text: string | Signal<string> | Array<string | Signal<string>> = '',
    properties?: TextProperties<EM>,
    defaultProperties?: AllOptionalProperties,
  ) {
    super()
    this.matrixAutoUpdate = false
    setupParentContextSignal(this.parentContextSignal, this)
    this.propertiesSignal = deepSignal(properties ?? {})
    this.defaultPropertiesSignal = deepSignal(defaultProperties ?? {})
    this.textSignal = signal(text)

    this.unsubscribe = effect(() => {
      const parentContext = this.parentContextSignal.value?.value
      if (parentContext == null) {
        return
      }
      const abortController = new AbortController()
      const state = createTextState(
        parentContext,
        this.textSignal,
        parentContext.fontFamiliesSignal,
        this.styleSignal,
        this.propertiesSignal,
        this.defaultPropertiesSignal,
      )
      this.internals = state
      this.mergedProperties = state.mergedProperties

      setupText(state, parentContext, this.styleSignal, this.propertiesSignal, this, abortController.signal)

      super.add(this.internals.interactionPanel)
      bindHandlers(state.handlers, this, abortController.signal)
      return () => {
        this.remove(this.internals.interactionPanel)
        abortController.abort()
      }
    })
  }

  setText(text: string | Signal<string> | Array<string | Signal<string>>) {
    this.textSignal.value = text
  }

  getComputedProperty<K extends keyof TextProperties<EM>>(key: K): TextProperties<EM>[K] | undefined {
    // @ts-expect-error
    return untracked(() => this.mergedProperties?.[key])
  }

  getStyle(): undefined | Readonly<TextProperties<EM>> {
    return this.styleSignal.peek()
  }

  setStyle(style: TextProperties<EM> | undefined, replace?: boolean) {
    this.styleSignal.value = replace ? style : ({ ...this.styleSignal.value, ...style } as any)
  }

  setProperties(properties: TextProperties<EM> | undefined) {
    Object.assign(this.propertiesSignal, properties)
  }

  setDefaultProperties(properties: AllOptionalProperties) {
    Object.assign(this.defaultPropertiesSignal, properties)
  }

  destroy() {
    this.parent?.remove(this)
    this.unsubscribe()
  }
}
