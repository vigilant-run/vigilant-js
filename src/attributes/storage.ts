import { AttributeAppender } from './attributes'

export function withAttributes(
  attributes: Record<string, string>,
  callback: () => void,
): void {
  if (!globalStorage) {
    callback()
    return
  }

  const current = globalStorage.getStore() || {}
  const updated = { ...current, ...attributes }

  globalStorage.run(updated, callback)
}

export class StoredAttributeAppender implements AttributeAppender {
  append = (attributes: Record<string, string>): void => {
    const stored = globalStorage.getStore()
    Object.assign(attributes, stored)
  }
}

export class StoredAttributeAppenderFactory {
  static create = (): StoredAttributeAppender => {
    return new StoredAttributeAppender()
  }
}

interface Storage<T> {
  run(store: T, callback: (...args: any[]) => void): void
  getStore(): T | undefined
}

class NoopStorage implements Storage<Record<string, string>> {
  run = (_: Record<string, string>, callback: () => void): void => {
    callback()
  }
  getStore = (): Record<string, string> | undefined => {
    return {}
  }
}

let globalStorage: Storage<Record<string, string>> = new NoopStorage()

function initGlobalStorage(): void {
  try {
    const { AsyncLocalStorage } = require('node:async_hooks')
    globalStorage = new AsyncLocalStorage()
  } catch {
    globalStorage = new NoopStorage()
  }
}

initGlobalStorage()
