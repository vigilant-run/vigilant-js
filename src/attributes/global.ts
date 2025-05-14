import { AttributeAppender } from './attributes'

export class GlobalAttributeAppender implements AttributeAppender {
  private attributes: Record<string, string>

  constructor(attributes: Record<string, string>) {
    this.attributes = attributes
  }

  append = (attributes: Record<string, string>): void => {
    for (const [key, value] of Object.entries(this.attributes)) {
      attributes[key] = value
    }
  }
}

export class GlobalAttributeAppenderFactory {
  static create = (
    attributes: Record<string, string>,
  ): GlobalAttributeAppender => {
    return new GlobalAttributeAppender(attributes)
  }
}
