const Joi = require('joi');

const createCategory = {
    body: Joi.object().keys({
        name: Joi.string().required().min(2).max(50).messages({
            'string.min': 'Tên danh mục phải từ 2-50 ký tự',
            'string.max': 'Tên danh mục phải từ 2-50 ký tự',
            'any.required': 'Tên danh mục là bắt buộc'
        }),
        description: Joi.string().allow('', null).max(255).messages({
            'string.max': 'Mô tả không được vượt quá 255 ký tự'
        }),
    }),
};

const updateCategory = {
    params: Joi.object().keys({
        id: Joi.number().integer().required().messages({
            'number.base': 'ID danh mục phải là số',
            'any.required': 'ID danh mục là bắt buộc'
        }),
    }),
    body: Joi.object().keys({
        name: Joi.string().min(2).max(50),
        description: Joi.string().allow('', null).max(255),
    }).min(1).unknown(),
};

const deleteCategory = {
    params: Joi.object().keys({
        id: Joi.number().integer().required(),
    }),
};

module.exports = {
    createCategory,
    updateCategory,
    deleteCategory,
};
