import * as TYPES from '../src/Types.js'

class Option {
	#short
	#description = ''
	#long = null
	#type = TYPES.BOOLEAN
	#required = false

	constructor(short, description = '', long = null, type = TYPES.BOOLEAN, required = false) {
		if (!short) {
			throw new Error('Short is required for Options')
		}

		this.#short = short
		this.#description = description
		this.#long = long
		this.#type = type
		this.#required = required
	}

	short(newValue) {
		if (newValue === undefined) {
			return this.#short
		}

		this.#short = newValue

		return this
	}

	description(newValue) {
		if (newValue === undefined) {
			return this.#description
		}

		this.#description = newValue

		return this
	}

	long(newValue) {
		if (newValue === undefined) {
			return this.#long
		}

		this.#long = newValue

		return this
	}

	type(newValue) {
		if (newValue === undefined) {
			return this.#type
		}

		this.#type = newValue

		return this
	}

	required(newValue) {
		if (newValue === undefined) {
			return this.#required
		}

		this.#required = newValue

		return this
	}
}

export default Option
