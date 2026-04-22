const Joi = require('joi');

const register = {
    body: Joi.object().keys({
        email: Joi.string().required().email().messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc'
        }),
        password: Joi.string().required().min(6).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/).messages({
            'string.min': 'Mật khẩu cần ít nhất 6 ký tự',
            'string.pattern.base': 'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
            'any.required': 'Mật khẩu là bắt buộc'
        }),
        username: Joi.string().required().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).messages({
            'string.min': 'Username phải từ 3-20 ký tự',
            'string.max': 'Username phải từ 3-20 ký tự',
            'string.pattern.base': 'Username không được chứa ký tự đặc biệt',
            'any.required': 'Username là bắt buộc'
        }),
        full_name: Joi.string().required().messages({
            'any.required': 'Họ tên là bắt buộc'
        }),
    }),
};

const login = {
    body: Joi.object().keys({
        username: Joi.string().required().messages({
            'any.required': 'Username là bắt buộc'
        }),
        password: Joi.string().required().messages({
            'any.required': 'Mật khẩu là bắt buộc'
        }),
    }),
};

module.exports = {
    register,
    login,
};
