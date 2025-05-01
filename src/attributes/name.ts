import { AttributeAppender } from './attributes'

export class NameAttributeAppender implements AttributeAppender {
  private name: string

  constructor(name: string) {
    this.name = name
  }

  append = (attributes: Record<string, string>): void => {
    attributes['service'] = this.name
  }
}

export class NameAttributeAppenderFactory {
  static create = (name: string): NameAttributeAppender => {
    return new NameAttributeAppender(name)
  }
}
