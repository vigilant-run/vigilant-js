import { Attributes } from '@opentelemetry/api'
import { LogAttributes } from '@opentelemetry/api-logs'

interface AsyncLocalStorageConstructor {
  new <T>(): {
    run(store: T, callback: (...args: any[]) => void): void
    getStore(): T | undefined
  }
}

let asyncLocalStorage: AsyncLocalStorageConstructor | null = null
let isInitialized = false

class NoopAsyncLocalStorage<T> {
  run(store: T, callback: (...args: any[]) => void): void {
    callback()
  }
  getStore(): T | undefined {
    return undefined
  }
}

export class AttributeStorage {
  private static localStorage = asyncLocalStorage
    ? new asyncLocalStorage<Attributes>()
    : new NoopAsyncLocalStorage<Attributes>()

  static run(attributes: Attributes, callback: () => void): void {
    this.localStorage.run(attributes, callback)
  }

  static getStore(): Attributes | undefined {
    return this.localStorage.getStore()
  }
}

export function initAttributeStorage(): void {
  try {
    const asyncHooks = require('node:async_hooks')
    asyncLocalStorage = asyncHooks.AsyncLocalStorage
  } catch {
    console.error(
      'AsyncLocalStorage is not available, it is only supported in Node.js',
    )
    asyncLocalStorage = null
  } finally {
    isInitialized = true
  }
}

export function addLoggerAttribute(
  attributes: Attributes,
  callback: () => void,
): void {
  if (!isInitialized) {
    initAttributeStorage()
  }
  AttributeStorage.run(attributes, callback)
}

export function getLoggerAttributes(): Attributes {
  if (!isInitialized) {
    initAttributeStorage()
  }
  return AttributeStorage.getStore() || {}
}
