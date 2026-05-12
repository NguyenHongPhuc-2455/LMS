const Joi = require('joi');

const updateProfile = {
    body: Joi.object().keys({
        full_name: Joi.string().allow('', null),
        email: Joi.string().email().allow('', null),
        phone: Joi.string().allow('', null),
        dob: Joi.date().allow('', null),
        gender: Joi.string().allow('', null),
        bio: Joi.string().allow('', null),
        avatar: Joi.string().allow('', null),
        employee_id: Joi.string().max(50).allow('', null),
        department_id: Joi.number().integer().allow(null),
        position: Joi.string().max(100).allow('', null),
        join_date: Joi.date().allow('', null),
    }),
};

const createUser = {
    body: Joi.object().keys({
        username: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        full_name: Joi.string().allow('', null),
        role_id: Joi.number().integer(),
        employee_id: Joi.string().max(50).allow('', null),
        department_id: Joi.number().integer().allow(null),
        position: Joi.string().max(100).allow('', null),
        join_date: Joi.date().allow('', null),
    }),
};

const updateUser = {
    params: Joi.object().keys({
        id: Joi.number().required(),
    }),
    body: Joi.object().keys({
        username: Joi.string(),
        email: Joi.string().email(),
        full_name: Joi.string().allow('', null),
        role_id: Joi.number().integer(),
        phone: Joi.string().allow('', null),
        dob: Joi.date().allow('', null),
        gender: Joi.string().allow('', null),
        bio: Joi.string().allow('', null),
        avatar: Joi.string().allow('', null),
        employee_id: Joi.string().max(50).allow('', null),
        department_id: Joi.number().integer().allow(null),
        position: Joi.string().max(100).allow('', null),
        join_date: Joi.date().allow('', null),
    }),
};

module.exports = {
    updateProfile,
    createUser,
    updateUser,
};
