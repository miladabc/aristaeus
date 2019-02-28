const Joi = require('joi');

const schema = Joi.object().keys({
	username: Joi.string().alphanum().min(3).max(30),
	password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/),
	access_token: [Joi.string(), Joi.number()],
	birthyear: Joi.number().integer().min(1900).max(2013),
	email: Joi.string().email({ minDomainAtoms: 2 })
}).and(['username', 'email', 'birthyear']).without('password', 'access_token');

const obj = {
	username: 'abc',
	birthyear: 2013,
	password: 'a123',
	//access_token: 'sdfsdf7336sdf',
	email: 'milad@yahoo.com'
};

Joi.validate(obj, schema, function(err, value) {
	console.log(err);
	console.log(value);
});