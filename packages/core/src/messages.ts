import chalk from 'chalk'

export const ConfigTokenRequiredError = buildError(
  `You cannot have an empty token when initializing Vigilant.
Generate one by visiting: https://dashboard.vigilant.run/settings/project/api`,
  `import { initVigilant } from '@vigilant/core'

const config = {
  name: 'My Application',
  token: 'your-token-here',
}

initVigilant(config)`,
)

export const ConfigNameRequiredError = buildError(
  `You cannot use an empty name when initializing Vigilant.
Use the name of your application or service, e.g. 'backend', 'api', etc.`,
  `import { initVigilant } from '@vigilant/core'

const config = {
  name: 'My Application',
  token: 'your-token-here',
}

initVigilant(config)`,
)

export const NotInitializedError = buildError(
  `Vigilant has not been initialized.
Use the 'initVigilant()' function to initialize Vigilant.`,
  `const config = {
  name: 'backend',
  token: 'your-token-here',
}

initVigilant(config)`,
)

export const BatcherInvalidTokenError = buildError(
  `The token you have provided is invalid.
Please generate a new token by visiting: https://dashboard.vigilant.run/settings/project/api
If the issue persists, please contact support@vigilant.run`,
  `import { initVigilant } from '@vigilant/core'

const config = {
  name: 'backend',
  token: 'your-token-here',
}

initVigilant(config)`,
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

export const InvalidAlertTitleError = buildError(
  `The alert title is invalid.
The title must be a string.`,
  `import { createAlert } from '@vigilant/core'

createAlert('Hello, world!')`,
)

export const InvalidLogMessageWarning = (message: any) => {
  return buildWarning(
    `This message is invalid: ${message}.
The message must be a string.`,
  )
}

export const InvalidAttributesWarning = (
  attributes: Record<string, string>,
) => {
  return buildWarning(
    `The following attributes are invalid: ${Object.values(attributes).join(', ')}.
Only string keys and values are supported.`,
  )
}

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
