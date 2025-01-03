import { Attributes } from './attributes'

interface InternalAsyncStorage<T> {
  run(store: T, callback: (...args: any[]) => void): void
  getStore(): T | undefined
}

let storage: InternalAsyncStorage<Attributes> | null = null
let isInitialized = false

export class LoggerStorage {
  private storage: InternalAsyncStorage<Attributes> | null = null

  constructor(storage: InternalAsyncStorage<Attributes> | null = null) {
    this.storage = storage
  }

  run(attributes: Attributes, callback: () => void): void {
    if (!this.storage) {
      callback()
    } else {
      this.storage.run(attributes, callback)
    }
  }

  getStore(): Attributes | undefined {
    return this.storage?.getStore()
  }
}

export function initLoggerStorage(): void {
  try {
    const { AsyncLocalStorage } = require('node:async_hooks')
    const asyncLocalStorage = new AsyncLocalStorage()
    storage = new LoggerStorage(asyncLocalStorage)
  } catch {
    console.error('AsyncLocalStorage is not available')
    storage = null
  } finally {
    isInitialized = true
  }
}

export function addAttributes(
  attributes: Attributes,
  callback: () => void,
): void {
  if (!isInitialized) {
    initLoggerStorage()
  }
  if (!storage) {
    callback()
  } else {
    const currentStore = storage.getStore() || {}
    const updatedStore = { ...currentStore, ...attributes }
    storage.run(updatedStore, callback)
  }
}

export function clearAttributes(callback: () => void): void {
  if (!isInitialized) {
    initLoggerStorage()
  }
  if (!storage) {
    callback()
  } else {
    storage.run({}, callback)
  }
}

export function removeAttributes(keys: string[], callback: () => void): void {
  if (!isInitialized) {
    initLoggerStorage()
  }
  if (!storage) {
    callback()
  } else {
    const currentStore = storage.getStore() || {}
    const updatedStore = Object.fromEntries(
      Object.entries(currentStore).filter(([key]) => !keys.includes(key)),
    )
    storage.run(updatedStore, callback)
  }
}

export function getAttributes(): Attributes {
  if (!isInitialized) {
    initLoggerStorage()
  }
  if (!storage) {
    return {}
  } else {
    return storage.getStore() || {}
  }
}
