const Joi = require('joi');

const createCourse = {
    body: Joi.object().keys({
        title: Joi.string().required().min(5).max(100),
        description: Joi.string().allow('', null),
        thumbnail: Joi.string().allow('', null),
        is_private: Joi.boolean().default(false),
        level: Joi.string().valid('Cơ bản', 'Trung cấp', 'Nâng cao').default('Cơ bản'),
        category_id: Joi.number().integer().allow(null),
        learning_outcomes: Joi.string().allow('', null),
        requirements: Joi.string().allow('', null),
        intro_video_url: Joi.string().allow('', null),
    }).unknown(),
};

const updateCourse = {
    params: Joi.object().keys({
        id: Joi.number().integer().required(),
    }),
    body: Joi.object().keys({
        title: Joi.string().min(5).max(100),
        description: Joi.string().allow('', null),
        thumbnail: Joi.string().allow('', null),
        is_private: Joi.boolean(),
        level: Joi.string().valid('Cơ bản', 'Trung cấp', 'Nâng cao'),
        category_id: Joi.number().integer().allow(null),
        learning_outcomes: Joi.string().allow('', null),
        requirements: Joi.string().allow('', null),
        intro_video_url: Joi.string().allow('', null),
    }).min(1).unknown(),
};

const createSection = {
    body: Joi.object().keys({
        course_id: Joi.number().integer().required(),
        title: Joi.string().required().min(3).max(100),
        order: Joi.number().integer().default(0),
    }).unknown(),
};

const updateSection = {
    params: Joi.object().keys({
        id: Joi.number().integer().required(),
    }),
    body: Joi.object().keys({
        title: Joi.string().min(3).max(100),
        order: Joi.number().integer(),
    }).min(1).unknown(),
};

const getById = {
    params: Joi.object().keys({
        id: Joi.number().integer().required(),
    }),
};

module.exports = {
    createCourse,
    updateCourse,
    createSection,
    updateSection,
    getById,
};
