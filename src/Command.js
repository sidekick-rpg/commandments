import * as TYPES from '../src/Types.js'
import Option from '../src/Option.js'
import parser from 'yargs-parser'

const filterOutEmpty = part => { return part.length > 0 }

class Command {
	#name = ''
	#description = ''
	#handler = null
	#options = []
	#params = []
	#commands = []
	#parent = null

	constructor(name, description = '', handler = null) {
		if (!name) {
			throw new Error('Name is required for Commands')
		}

		this.#name = name
		this.#description = description ? description : ''
		this.#handler = handler ? handler : ''
	}

	name(newValue) {
		if (newValue === undefined) {
			return this.#name
		}

		this.#name = newValue

		return this
	}

	description(newValue) {
		if (newValue === undefined) {
			return this.#description
		}

		this.#description = newValue

		return this
	}

	handler(newValue) {
		if (newValue === undefined) {
			return this.#handler
		}

		this.#handler = newValue

		return this
	}

	addOption(option) {
		this.#options.push(option)

		return this
	}

	addOptions(options) {
		options.forEach(option => {
			this.addOption(option)
		})

		return this
	}

	addParam(param) {
		this.#params.push(param)

		return this
	}

	addParams(params) {
		params.forEach(param => {
			this.addParam(param)
		})

		return this
	}

	addCommand(command) {
		this.#commands.push(command)

		command.parent(this)

		return this
	}

	addCommands(commands) {
		commands.forEach(command => {
			this.addCommand(command)
		})

		return this
	}

	parent(command) {
		if (command === undefined) {
			return this.#parent
		}

		this.#parent = command

		return this
	}

	usage() {
		const usageLine = []

		const commandList = this.#buildCommandList()
		const commands = commandList.join(' ')
		const prefix = `Usage: ${commands}`
		usageLine.push(prefix)

		const subCommandsLines = this.#buildSubCommandLines(this.#commands)

		const optionList = this.#buildUsageOptionList()
		const optionParts = this.#buildUsageOptionParts(optionList)
		usageLine.push(optionParts.join(' '))

		const paramList = this.#buildUsageParamList()
		const paramParts = this.#buildUsageParamParts(paramList)
		usageLine.push(paramParts.join(' '))

		if (this.#commands.length > 0) {
			usageLine.push('[<command>]')
		}

		const optionsLines = this.#buildUsageOptionsLines(this.#options)
		const paramsLines = this.#buildUsageParamsLines(this.#params)

		return [
			usageLine.filter(filterOutEmpty).join(' '),
			this.#description,
			subCommandsLines.length > 0 ? 'Commands:' : '',
			subCommandsLines.join("\n"),
			optionsLines.length > 0 ? 'Options:' : '',
			optionsLines.join("\n"),
			paramsLines.length > 0 ? 'Parameters:' : '',
			paramsLines.join("\n"),
		].filter(filterOutEmpty).join("\n\n")
	}

	run(unparsed) {
		const command = this.matchingCommand(unparsed)

		if (command === null) {
			//error not a command
			return null
		}

		const aliases = command.aliases()

		const parsed = parser(unparsed, {
			alias: aliases,
			configuration: {
				'strip-aliased': true,
			},
		})
		delete parsed['_']
		delete parsed['--']

		console.log('detailed', parser.detailed(unparsed, {
			alias: aliases,
			configuration: {
				'strip-aliased': true,
			},
		}))

		const handler = command.handler()

		return handler.apply(null, [ parsed ])
	}

	matchingCommand(unparsed) {
		const parsed = parser(unparsed)
		const commandsList = parsed['_']
		const matchingCommand = this.#findMatchingCommand(this, commandsList)

		if (matchingCommand === null) {
			return null
		}

		return matchingCommand
	}

	aliases() {
		const aliases = {}

		this.#options.forEach(option => {
			if (option.long()) {
				console.log('alias', option.long(), option.short())
				aliases[option.long()] = [ option.short() ]
			}
		})

		return aliases
	}

	#buildCommandList() {
		const list = [ this.#name ]

		let parent = this

		while (parent = parent.parent()) {
			list.push(parent.name())
		}

		list.reverse()

		return list
	}

	#buildSubCommandLines(commands) {
		const lines = []
		const maxLengths = {
			name: 0,
		}

		commands.forEach(command => {
			if (command.name().length > maxLengths.name) {
				maxLengths.name = command.name().length
			}
		})

		commands.forEach(command => {
			const parts = [
				command.name().padEnd(maxLengths.name, ' '),
				command.description(),
			]

			lines.push('    ' + parts.join('  '))
		})

		return lines
	}

	#buildUsageOptionList() {
		const booleans = []
		const optional = []
		const required = []

		this.#options.forEach(option => {
			if (option.required() === true) {
				required.push(option)
			} else if (option.type() === TYPES.BOOLEAN) {
				booleans.push(option)
			} else {
				optional.push(option)
			}
		})

		return {
			booleans,
			optional,
			required,
		}
	}

	#buildUsageOptionParts(optionList) {
		const parts = []
		let combined = []
		optionList.booleans.forEach(opt => {
			combined.push(opt.short())
		})
		if (combined.length > 0) {
			parts.push(`[-${combined.join('')}]`)
		}

		combined = []
		optionList.optional.forEach(opt => {
			combined.push(`-${opt.short()} ${opt.type()}`)
		})
		if (combined.length > 0) {
			parts.push(`[${combined.join(' ')}]`)
		}

		combined = []
		optionList.required.forEach(opt => {
			combined.push(`-${opt.short()} ${opt.type()}`)
		})
		if (combined.length > 0) {
			parts.push(combined.join(' '))
		}

		return parts
	}

	#buildUsageOptionsLines(options) {
		const lines = []

		const maxLengths = {
			short: 0,
			long: 0,
		}

		options.forEach(opt => {
			if (opt.short().length > maxLengths.short) {
				maxLengths.short = opt.short().length
			}

			if (opt.long().length > maxLengths.long) {
				maxLengths.long = opt.long().length
			}
		})

		options.forEach(opt => {
			const suffix = []
			if (opt.type() !== TYPES.BOOLEAN) {
				suffix.push(opt.type())
			}
			if (opt.required() === true) {
				suffix.push('required')
			}
			const description = [
				opt.description(),
				suffix.length > 0 ? `(${suffix.join(', ')})` : '',
			]

			const parts = [
				'-' + opt.short().padEnd(maxLengths.short, ' '),
				'--' + opt.long().padEnd(maxLengths.long, ' '),
				description.filter(filterOutEmpty).join(' '),
			]

			lines.push('    ' + parts.join('  '))
		})

		return lines
	}

	#buildUsageParamList() {
		const required = []
		const optional = []
		let multiple = null

		this.#params.forEach(param => {
			if (param.multiple() === true) {
				multiple = param
			} else if (param.required() === true) {
				required.push(param)
			} else {
				optional.push(param)
			}
		})

		return {
			required,
			optional,
			multiple,
		}
	}

	#buildUsageParamParts(paramList) {
		const parts = []

		let combined = []
		paramList.required.forEach(param => {
			combined.push(`<${param.name()}>`)
		})
		if (combined.length > 0) {
			parts.push(combined.join(' '))
		}

		combined = []
		paramList.optional.forEach(param => {
			combined.push(`[<${param.name()}>]`)
		})
		if (combined.length > 0) {
			parts.push(combined.join(' '))
		}
		if (paramList.multiple !== null) {
			let part = `<...${paramList.multiple.name()}>`
			if (paramList.multiple.required() === false) {
				part = `[${part}]`
			}

			parts.push(part)
		}

		return parts
	}

	#buildUsageParamsLines(params) {
		const lines = []
		const maxLengths = {
			name: 0,
		}

		params.forEach(param => {
			if (param.name().length > maxLengths.name) {
				maxLengths.name = param.name().length
			}
		})

		params.forEach(param => {
			const suffix = [param.type()]
			if (param.required() === true) {
				suffix.push('required')
			}
			if (param.multiple() === true) {
				suffix.push('multiple')
			}
			const description = [
				param.description(),
				suffix.length > 0 ? `(${suffix.join(', ')})` : '',
			]

			const parts = [
				param.name().padEnd(maxLengths.name, ' '),
				description.filter(filterOutEmpty).join(' '),
			]

			lines.push('    ' + parts.join('  '))
		})

		return lines
	}

	#findMatchingCommand(command, commandsList) {
		const next = commandsList.shift()
		let match

		if (command.name() === next) {
			match = command
		} else {
			// Find sub-commands that match
			match = command.#commands.find(cmd => cmd.name() === next)
		}

		if (match !== undefined && commandsList.length > 0) {
			const subMatch = this.#findMatchingCommand(match, commandsList)

			if (subMatch !== null) {
				match = subMatch
			}
		}

		return match ?? null
	}
}

export default Command
