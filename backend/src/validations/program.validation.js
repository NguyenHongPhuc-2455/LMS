const Joi = require('joi');

const createProgram = {
    body: Joi.object().keys({
        title: Joi.string().required().min(5).max(100),
        description: Joi.string().allow('', null),
        thumbnail: Joi.string().allow('', null),
        price: Joi.number().min(0).default(0),
        level: Joi.string().allow('', null),
        status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').allow('', null),
        is_private: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')),
        is_mandatory: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')),
        apply_scope: Joi.string().valid(
            'ALL_EMPLOYEE',
            'BY_DEPARTMENT',
            'BY_POSITION',
            'SPECIFIC_USER',
            'NEW_EMPLOYEE',
            'NEW_EMPLOYEE_BY_DEPARTMENT',
            'NEW_EMPLOYEE_BY_POSITION'
        ),
        mandatory_targets: Joi.any(),
        mandatory_deadline_days: Joi.number().integer().min(1).allow(null),
        mandatory_start_date: Joi.string().isoDate().allow('', null),
        mandatory_end_date: Joi.string().isoDate().allow('', null),
        allow_early_access: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false'))
    }).unknown(),
};

const updateProgram = {
    params: Joi.object().keys({
        id: Joi.number().integer().required(),
    }),
    body: Joi.object().keys({
        title: Joi.string().min(5).max(100),
        description: Joi.string().allow('', null),
        thumbnail: Joi.string().allow('', null),
        price: Joi.number().min(0),
        level: Joi.string().allow('', null),
        status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').allow('', null),
        is_private: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')),
        is_mandatory: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')),
        apply_scope: Joi.string().valid(
            'ALL_EMPLOYEE',
            'BY_DEPARTMENT',
            'BY_POSITION',
            'SPECIFIC_USER',
            'NEW_EMPLOYEE',
            'NEW_EMPLOYEE_BY_DEPARTMENT',
            'NEW_EMPLOYEE_BY_POSITION'
        ),
        mandatory_targets: Joi.any(),
        mandatory_deadline_days: Joi.number().integer().min(1).allow(null),
        mandatory_start_date: Joi.string().isoDate().allow('', null),
        mandatory_end_date: Joi.string().isoDate().allow('', null),
        allow_early_access: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false'))
    }).min(1).unknown(),
};

const getById = {
    params: Joi.object().keys({
        id: Joi.number().integer().required(),
    }),
};

const addCourse = {
    params: Joi.object().keys({
        id: Joi.number().integer().required(),
    }),
    body: Joi.object().keys({
        course_id: Joi.number().integer().required(),
    }),
};

module.exports = {
    createProgram,
    updateProgram,
    getById,
    addCourse,
};
