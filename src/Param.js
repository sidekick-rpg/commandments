import * as TYPES from '../src/Types.js'

class Param {
	#name
	#description = ''
	#required = true
	#type = TYPES.STRING
	#multiple = false

	constructor(name, description = '', required = true, type = TYPES.STRING, multiple = false) {
		if (!name) {
			throw new Error('Name is required for Options')
		}

		this.#name = name
		this.#description = description
		this.#required = required
		this.#type = type
		this.#multiple = multiple
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

	required(newValue) {
		if (newValue === undefined) {
			return this.#required
		}

		this.#required = newValue

		return this
	}

	type(newValue) {
		if (newValue === undefined) {
			return this.#type
		}

		this.#type = newValue

		return this
	}

	multiple(newValue) {
		if (newValue === undefined) {
			return this.#multiple
		}

		this.#multiple = newValue

		return this
	}
}

export default Param
