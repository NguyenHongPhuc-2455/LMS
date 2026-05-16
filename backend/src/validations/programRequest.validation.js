const Joi = require('joi');

const requestAccess = {
    body: Joi.object().keys({
        programId: Joi.number().required().messages({
            'any.required': 'Program ID là bắt buộc',
            'number.base': 'Program ID phải là số'
        }),
        reason: Joi.string().allow('', null).max(500).messages({
            'string.max': 'Lý do không được quá 500 ký tự'
        })
    })
};

const bulkAction = {
    body: Joi.object().keys({
        ids: Joi.array().items(Joi.number()).min(1).required().messages({
            'array.min': 'Danh sách ID không được để trống',
            'any.required': 'Danh sách ID là bắt buộc'
        })
    })
};

module.exports = {
    requestAccess,
    bulkAction
};
