import { AttributeAppender } from './attributes'

const ServiceNameKey = 'service.name'

export class ServiceNameAttributeAppender implements AttributeAppender {
  private serviceName: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  append = (attributes: Record<string, string>): void => {
    Object.assign(attributes, {
      [ServiceNameKey]: this.serviceName,
    })
  }
}

export class ServiceNameAttributeAppenderFactory {
  static create = (serviceName: string): ServiceNameAttributeAppender => {
    return new ServiceNameAttributeAppender(serviceName)
  }
}
