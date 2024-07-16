export const yup_uzLatn = {
	mixed: {
		default: 'Not valid',
		required: 'Required field',
		oneOf: ({ values }) => `Must match one of the following values: ${values}`,
		notOneOf: ({ values }) => `Must not match any of the following values: ${values}`,
	},
	string: {
		length: ({ length }) => `The field must be ${length}`,
		min: ({ min }) => `The field must be at least ${min} characters`,
		max: ({ max }) => `The field may not be greater than ${max} characters`,
		matches: ({ regex }) => `The field must looks like: "${regex}"`,
		email: 'The field must be a valid email',
		url: 'The field must be a valid URL',
		trim: 'The field can not contain space at the beginning and at the end',
		lowercase: 'The field must be lowercase',
		uppercase: 'The field must be uppercase',
	},
	number: {
		min: ({ min }) => `The field must be ${min} or more`,
		max: ({ max }) => `The field must be ${max} or less`,
		lessThan: ({ less }) => `muss kleiner sein als ${less}`,
		moreThan: ({ more }) => `muss größer sein als ${more}`,
		positive: 'Must be a positive number',
		negative: 'Must be a negative number',
		integer: 'Must be an integer',
	},
	boolean: {},
	date: {
		min: ({ min }) => `The field must be ${min} or more`,
		max: ({ max }) => `The field must be ${max} or less`,
	},
	object: {
		noUnknown: 'Field must not use keys that have not been defined',
	},
	array: {
		min: ({ min }) => `mmust be greater than or equal to ${min}`,
		max: ({ max }) => `must be less than or equal to ${max}`,
	},
};
