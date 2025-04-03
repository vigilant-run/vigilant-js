import chalk from 'chalk'

export const ConfigNotValidError = buildError(
  `The configuration is invalid.
The configuration must be a valid AgentConfig.
Use the 'AgentConfigBuilder' to create a valid configuration.
Generate a token by visiting: https://dashboard.vigilant.run/settings/project/api`,
  `import { init, AgentConfigBuilder } from 'vigilant-js'

const config = new AgentConfigBuilder()
  .withName('My Application')
  .withToken('your-token-here')
  .build()

init(config)`,
)

export const ConfigTokenRequiredError = buildError(
  `You cannot have an empty token when creating the Vigilant Agent.
Use the 'withToken()' method on the builder to set a token.
Generate one by visiting: https://dashboard.vigilant.run/settings/project/api`,
  `import { init, AgentConfigBuilder } from 'vigilant-js'

const config = new AgentConfigBuilder()
  .withName('My Application')
  .withToken('your-token-here')
  .build()

init(config)`,
)

export const ConfigNameRequiredError = buildError(
  `You cannot use an empty name when creating the Vigilant Agent.
Use the 'withName()' method on the builder to set a name.
Use the name of your application or service, e.g. 'backend', 'api', etc.`,
  `import { init, AgentConfigBuilder } from 'vigilant-js'

const config = new AgentConfigBuilder()
  .withName('backend')
  .withToken('your-token-here')
  .build()

init(config)`,
)

export const AgentNotInitializedError = buildError(
  `The Vigilant Agent has not been initialized.
Use the 'init()' function to initialize the agent.`,
  `const config = new AgentConfigBuilder()
  .withName('backend')
  .withToken('your-token-here')
  .build()

init(config)`,
)

export const BatcherInvalidTokenError = buildError(
  `The token you have provided is invalid.
Please generate a new token by visiting: https://dashboard.vigilant.run/settings/project/api
If the issue persists, please contact support@vigilant.run`,
  `import { init, AgentConfigBuilder } from 'vigilant-js'

const config = new AgentConfigBuilder()
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
  `import { logInfo } from 'vigilant-js'

logInfo('Hello, world!', { user: 'A Name', id: 'An ID' })`,
)

export const InvalidMessageError = buildError(
  `The message is invalid.
The message must be a string.`,
  `import { logInfo } from 'vigilant-js'

logInfo('Hello, world!')`,
)

function buildError(message: string, exampleUsage?: string) {
  let errorMessage = `\n\n${chalk.hex('#FF8480').bold('[ **** Vigilant Error **** ]')}\n\n`
  errorMessage += `${message}\n\n`

  if (exampleUsage) {
    errorMessage += `${chalk.hex('#81FF80')('[ **** Correct Usage **** ]')}\n\n${exampleUsage}\n\n`
  }

  return new Error(errorMessage)
}
