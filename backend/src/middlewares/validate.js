const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
    const validKeys = ['params', 'query', 'body'];
    const object = validKeys.reduce((obj, key) => {
        if (Object.prototype.hasOwnProperty.call(schema, key)) {
            obj[key] = req[key];
        }
        return obj;
    }, {});

    const { value, error } = Joi.compile(schema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate(object);

    if (error) {
        const errorMessage = error.details
            .map((details) => details.message)
            .join(', ');
        return next(new ApiError(400, errorMessage));
    }
    Object.assign(req, value);
    return next();
};

module.exports = validate;
