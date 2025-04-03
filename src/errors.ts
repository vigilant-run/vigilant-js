export const ConfigNotValidError = new Error(
  `\n\n[ **** Vigilant Error **** ]\n
The configuration is invalid.
The configuration must be a valid AgentConfig.
Use the 'AgentConfigBuilder' to create a valid configuration.
Generate a token by visiting: https://dashboard.vigilant.run/settings/project/api

Example Usage:

import { init, AgentConfigBuilder } from 'vigilant-js'

const config = new AgentConfigBuilder()
  .withName('My Application')
  .withToken('your-token-here')
  .build()

init(config)\n\n`,
)

export const ConfigTokenRequiredError = new Error(
  `\n\n[ **** Vigilant Error **** ]\n
You cannot have an empty token when creating the Vigilant Agent.
Use the 'withToken()' method on the builder to set a token.
Generate one by visiting: https://dashboard.vigilant.run/settings/project/api

Example Usage:

import { init, AgentConfigBuilder } from 'vigilant-js'

const config = new AgentConfigBuilder()
  .withName('My Application')
  .withToken('your-token-here')
  .build()

init(config)\n\n`,
)

export const ConfigNameRequiredError = new Error(
  `\n\n[ **** Vigilant Error **** ]\n
You cannot use an empty name when creating the Vigilant Agent.
Use the 'withName()' method on the builder to set a name.
Use the name of your application or service, e.g. 'backend', 'api', etc.\n\n

Example Usage:

import { init, AgentConfigBuilder } from 'vigilant-js'

const config = new AgentConfigBuilder()
  .withName('backend')
  .withToken('your-token-here')
  .build()

init(config)\n\n`,
)

export const AgentNotInitializedError = new Error(
  `\n\n[ **** Vigilant Error **** ]\n
The Vigilant Agent has not been initialized.
Use the 'init()' function to initialize the agent.

Example Usage:

const config = new AgentConfigBuilder()
  .withName('backend')
  .withToken('your-token-here')
  .build()

init(config)\n\n`,
)

export const InvalidAttributesError = new Error(
  `\n\n[ **** Vigilant Error **** ]\n
The attributes are invalid.
Attributes must be a non-null object.
The keys and values must be strings.

Example Usage:

import { logInfo } from 'vigilant-js'

logInfo('Hello, world!', { user: 'A Name', id: 'An ID' })\n\n`,
)

export const InvalidMessageError = new Error(
  `\n\n[ **** Vigilant Error **** ]\n
The message is invalid.
The message must be a string.

Example Usage:

import { logInfo } from 'vigilant-js'

logInfo('Hello, world!')\n\n`,
)
