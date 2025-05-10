import { AllOptionalProperties } from '@pmndrs/uikit'
import { Signal } from '@preact/signals-core'
import { ReactNode, createContext, useContext, useMemo } from 'react'

const DefaultPropertiesContext = createContext<AllOptionalProperties | undefined>(undefined)

export function useDefaultProperties(): AllOptionalProperties | undefined {
  return useContext(DefaultPropertiesContext)
}

export type DefaultPropertiesProperties = { children?: ReactNode } & AllOptionalProperties

const createDefaultPropertiesHash = (properties: AllOptionalProperties | undefined) => {
  if (properties === undefined) {
    return ''
  }
  return Array.from(Object.entries(properties))
    .sort(([ka], [kb]) => (ka > kb ? 1 : ka < kb ? -1 : 0))
    .map(([k, v]) => {
      switch (typeof v) {
        case 'function':
          console.warn('no function in default props please', k)
          return ''
        case 'object':
          if (Array.isArray(v)) {
            return v.join(',')
          }
          if (v instanceof Signal) {
            return `${k}=${v.peek()}`
          }
          for (let nk of Object.keys(v)) {
            if (typeof v[nk] === 'object') {
              console.warn('no deeply nested objects in default props please', k, v)
              return ''
            }
            if (typeof v[nk] === 'function') {
              console.warn('no functions nested in objects in default props please', k, v)
              return ''
            }
          }
          return `${k}=${JSON.stringify(v)}`
        default:
          if (v === undefined) return ''
          return `${k}=${v}`
      }
    })
    .join('&')
}

export function DefaultProperties({ children, ...properties }: DefaultPropertiesProperties) {
  const existingDefaultProperties = useContext(DefaultPropertiesContext)
  const existingDefaultPropertiesHash = createDefaultPropertiesHash(existingDefaultProperties)
  const propertiesHash = createDefaultPropertiesHash(properties)

  const result: any = useMemo(() => {
    const result: any = { ...existingDefaultProperties }
    for (const key in properties) {
      if (key === 'children') {
        continue
      }
      //TODO: this is not correctly merged but rather overwritten
      const value = properties[key as keyof AllOptionalProperties]
      if (value == null) {
        continue
      }
      result[key] = value as any
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingDefaultPropertiesHash, propertiesHash])

  return <DefaultPropertiesContext.Provider value={result}>{children}</DefaultPropertiesContext.Provider>
}
