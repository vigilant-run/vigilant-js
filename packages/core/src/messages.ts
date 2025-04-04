import chalk from 'chalk'

export const ConfigNotValidError = buildError(
  `The configuration is invalid.
The configuration must be a valid Config.
Use the 'ConfigBuilder' to create a valid configuration.
Generate a token by visiting: https://dashboard.vigilant.run/settings/project/api`,
  `import { init, ConfigBuilder } from '@vigilant/core'

const config = new ConfigBuilder()
  .withName('My Application')
  .withToken('your-token-here')
  .build()

init(config)`,
)

export const ConfigTokenRequiredError = buildError(
  `You cannot have an empty token when initializing Vigilant.
Use the 'withToken()' method on the builder to set a token.
Generate one by visiting: https://dashboard.vigilant.run/settings/project/api`,
  `import { init, ConfigBuilder } from '@vigilant/core'

const config = new ConfigBuilder()
  .withName('My Application')
  .withToken('your-token-here')
  .build()

init(config)`,
)

export const ConfigNameRequiredError = buildError(
  `You cannot use an empty name when initializing Vigilant.
Use the 'withName()' method on the builder to set a name.
Use the name of your application or service, e.g. 'backend', 'api', etc.`,
  `import { init, ConfigBuilder } from '@vigilant/core'

const config = new ConfigBuilder()
  .withName('backend')
  .withToken('your-token-here')
  .build()

init(config)`,
)

export const NotInitializedError = buildError(
  `Vigilant has not been initialized.
Use the 'init()' function to initialize Vigilant.`,
  `const config = new ConfigBuilder()
  .withName('backend')
  .withToken('your-token-here')
  .build()

init(config)`,
)

export const BatcherInvalidTokenError = buildError(
  `The token you have provided is invalid.
Please generate a new token by visiting: https://dashboard.vigilant.run/settings/project/api
If the issue persists, please contact support@vigilant.run`,
  `import { init, ConfigBuilder } from '@vigilant/core'

const config = new ConfigBuilder()
  .withName('backend')
  .withToken('your-token-here')
  .build()`,
)

export const BatchInternalServerError = buildError(
  `The server is experiencing issues.
Please contact support@vigilant.run`,
)

export const InvalidAttributesError = buildError(
  `The attributes are invalid.
Attributes must be a non-null object.
The keys and values must be strings.`,
  `import { logInfo } from '@vigilant/core'

logInfo('Hello, world!', { user: 'A Name', id: 'An ID' })`,
)

export const InvalidLogMessageError = buildError(
  `The message is invalid.
The message must be a string.`,
  `import { logInfo } from '@vigilant/core'

logInfo('Hello, world!')`,
)

export const InvalidAlertTitleError = buildError(
  `The alert title is invalid.
The title must be a string.`,
  `import { createAlert } from '@vigilant/core'

createAlert('Hello, world!')`,
)

export function buildError(message: string, exampleUsage?: string): Error {
  let errorMessage = `${chalk.hex('#FF8480').bold('[ **** Vigilant Error **** ]')}\n\n`
  errorMessage += `${message}\n\n`

  if (exampleUsage) {
    errorMessage += `${chalk.hex('#81FF80')('[ **** Correct Usage **** ]')}\n\n${exampleUsage}`
  }

  return new Error(errorMessage)
}

export function buildWarning(message: string): string {
  return `${chalk.hex('#FF8480').bold('[ **** Vigilant Warning **** ]')}\n\n${message}`
}
