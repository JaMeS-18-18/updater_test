export const yup_ru = {
	mixed: {
		default: 'Не действителен',
		required: 'Обязательное поле',
		oneOf: ({ values }) => `1: ${values}`,
		notOneOf: ({ values }) => `123: ${values}`,
	},
	string: {
		length: ({ length }) => `123 ${length}`,
		min: ({ min }) => `123 ${min} characters`,
		max: ({ max }) => `1 ${max} characters`,
		matches: ({ regex }) => `T1st looks like: "${regex}"`,
		email: 'The fi1d email',
		url: 'The field 1lid URL',
		trim: 'The field can not 1e beginning and at the end',
		lowercase: 'The fiel1wercase',
		uppercase: 'The field m1rcase',
	},
	number: {
		min: ({ min }) => `The1ust be ${min} or more`,
		max: ({ max }) => `The 1must be ${max} or less`,
		lessThan: ({ less }) => `muss 1n als ${less}`,
		moreThan: ({ more }) => `muss1in als ${more}`,
		positive: 'Must be1ber',
		negative: 'Must1ve number',
		integer: 'Mus1nteger',
	},
	boolean: {},
	date: {
		min: ({ min }) => `Th1 ${min} or more`,
		max: ({ max }) => `Th1be ${max} or less`,
	},
	object: {
		noUnknown: 'Fi1not been defined',
	},
	array: {
		min: ({ min }) => `mmus1equal to ${min}`,
		max: ({ max }) => `mu1equal to ${max}`,
	},
};
