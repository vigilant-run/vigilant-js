import { ServiceNameAttributeAppenderFactory } from './service'
import { StoredAttributeAppenderFactory } from './storage'

// Adds attributes to each log message
export interface AttributeAppender {
  append(attributes: Record<string, string>): void
}

// Manages all of the attribute appenders and transforms each set of attributes.
export class AttributeProvider {
  private appenders: AttributeAppender[]

  constructor(appenders: AttributeAppender[]) {
    this.appenders = appenders
  }

  // Modifies, in-place, the passed in attributes map.
  update = (attributes: Record<string, string>): void => {
    for (const appender of this.appenders) {
      appender.append(attributes)
    }
  }
}

// Creates a new AttributeProvider with attached appenders
export class AttributeProviderFactory {
  static create(serviceName: string): AttributeProvider {
    return new AttributeProvider([
      ServiceNameAttributeAppenderFactory.create(serviceName),
      StoredAttributeAppenderFactory.create(),
    ])
  }
}
