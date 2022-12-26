import * as TYPES from '../src/Types.js'
import Command from '../src/Command.js'
import Option from '../src/Option.js'
import Param from '../src/Param.js'
import { RunProvider } from './RunProvider.js'

describe('Command', () => {
	describe('usage', () => {
		function runner(expected, command) {
			const actual = command.usage()

			expect(actual).toStrictEqual(expected)
		}

		const basic = new Command('basic')
		const basicExpected = `Usage: basic`

		const basicWithDescription = new Command('description', 'This is the description')
		const basicWithDescriptionExpected = `Usage: description

This is the description`

		const basicWithParents = new Command('basic')
		const parent1 = new Command('parent1')
		const parent2 = new Command('parent2')

		basicWithParents.parent(parent2)
		parent2.parent(parent1)
		const basicWithParentsExpected = `Usage: parent1 parent2 basic`

		const withOptions = new Command('options')
		withOptions.addOption(new Option('1', 'Option One', 'one'))
		withOptions.addOption(new Option('2', 'Option Two', 'two'))
		withOptions.addOption(new Option('3', 'Option Three', 'three', TYPES.STRING, true))
		withOptions.addOption(new Option('4', 'Option Four', 'four', TYPES.INTEGER))

		const withOptionsExpected =
`
Usage: options [-12] [-4 integer] -3 string

Options:

    -1  --one    Option One
    -2  --two    Option Two
    -3  --three  Option Three (string, required)
    -4  --four   Option Four (integer)
`.trim()

		const withParams = new Command('params')
		withParams.addParam(new Param('one', 'Param One'))
		withParams.addParam(new Param('two', 'Param Two', true, TYPES.BOOLEAN))
		withParams.addParam(new Param('three', 'Param Three', false, TYPES.FLOAT))
		withParams.addParam(new Param('four', 'Param Four', false, TYPES.INTEGER, true))

		const withParamsExpected =
`
Usage: params <one> <two> [<three>] [<...four>]

Parameters:

    one    Param One (string, required)
    two    Param Two (boolean, required)
    three  Param Three (float)
    four   Param Four (integer, multiple)
`.trim()

		const subCommands = new Command('sub')
		subCommands.addCommand(new Command('one', 'First sub command'))
		subCommands.addCommand(new Command('twozz', 'Second sub command'))
		const subCommandsExpect = `
Usage: sub [<command>]

Commands:

    one    First sub command
    twozz  Second sub command
`.trim()

		const all = new Command('all')
		all.parent(parent1)
		all.addOption(new Option('k', 'Killing attack', 'killing'))
		all.addParam(new Param('ocv', 'OCV/OMCV', true, TYPES.INTEGER))
		all.addParam(new Param('dcv', 'DCV/DMCV', false, TYPES.INTEGER))
		const allExpected = `
Usage: parent1 all [-k] <ocv> [<dcv>]

Options:

    -k  --killing  Killing attack

Parameters:

    ocv  OCV/OMCV (integer, required)
    dcv  DCV/DMCV (integer)
`.trim()

		const dataProvider = {
			'basic': [
				basicExpected,
				basic,
			],
			'basic with description': [
				basicWithDescriptionExpected,
				basicWithDescription,
			],
			'basic with parents': [
				basicWithParentsExpected,
				basicWithParents,
			],
			'with options': [
				withOptionsExpected,
				withOptions,
			],
			'with params': [
				withParamsExpected,
				withParams,
			],
			'sub commands': [
				subCommandsExpect,
				subCommands,
			],
			'all': [
				allExpected,
				all,
			],
		}

		RunProvider(dataProvider, runner)
	})

	describe('matchingCommand can get the right handler', () => {
		function runner(expected, command, unparsed) {
			const actual = command.matchingCommand(unparsed)

			expect(actual.handler).toStrictEqual(expected)
		}

		const basicHandler = function () {}
		const basic = new Command('basic', '', basicHandler)
		const basicUnparsed = 'basic -i --foo bar'

		const subCommandHandler = function () {}
		const subCommandOne = new Command('one')
		const subCommandTwo = new Command('two')
		const subCommandThree = new Command('three', '', subCommandHandler)
		subCommandOne.addCommand(subCommandTwo)
		subCommandTwo.addCommand(subCommandThree)
		const subCommandUnparsed = 'one two three -i --foo bar'

		const dataProvider = {
			'basic': [
				basicHandler,
				basic,
				basicUnparsed,
			],
			'sub command': [
				subCommandHandler,
				subCommandOne,
				subCommandUnparsed,
			],
		}

		RunProvider(dataProvider, runner)
	})

	describe('run', () => {
		function runner(expected, command, unparsed) {
			const actual = command.run(unparsed)

			expect(actual).toStrictEqual(expected)
		}

		const basicExpected = 'this is the output from basic handler'
		const basicHandler = function () {
			return basicExpected
		}
		const basic = new Command('basic', '', basicHandler)
		const basicUnparsed = 'basic'

		const optionsExpected = 'options output: bar'
		const optionsHandler = function (params) {
			return `options output: ${params.foo}`
		}
		const options = new Command('options', '', optionsHandler)
		options.addOption(new Option('f', 'Foo', 'foo'))
		const optionsUnparsed = 'options --foo bar'

		const paramsExpected = 'params output: bar'
		const paramsHandler = function (params) {
			return `params output: ${params.foo}`
		}
		const params = new Command('params', '', paramsHandler)
		params.addParam(new Param('foo', 'Foo param'))
		const paramsUnparsed = 'params bar'

		const notCommand = new Command('not-command')
		const notCommandUnparsed = 'different-command'

		const dataProvider = {
			'basic': [
				basicExpected,
				basic,
				basicUnparsed,
			],
			'with options': [
				optionsExpected,
				options,
				optionsUnparsed,
			],
			'with params': [
				paramsExpected,
				params,
				paramsUnparsed,
			],
			'not a command': [
				null,
				notCommand,
				notCommandUnparsed,
			],
		}

		RunProvider(dataProvider, runner)
	})
})
