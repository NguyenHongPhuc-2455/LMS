const Joi = require('joi');

const createProgram = {
    body: Joi.object().keys({
        title: Joi.string().required().min(5).max(100),
        description: Joi.string().allow('', null),
        thumbnail: Joi.string().allow('', null),
        price: Joi.number().min(0).default(0),
    }),
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
    }).min(1),
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
