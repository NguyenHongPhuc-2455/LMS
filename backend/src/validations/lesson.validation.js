const Joi = require('joi');

const updateLesson = {
    params: Joi.object().keys({
        id: Joi.number().integer().required(),
    }),
    body: Joi.object().keys({
        section_id: Joi.number().integer(),
        title: Joi.string().min(3).max(100),
        content: Joi.string().allow('', null),
        order: Joi.number().integer(),
        duration: Joi.number().min(0).allow(null),
    }).min(1).unknown(),
};

const getById = {
    params: Joi.object().keys({
        id: Joi.number().integer().required(),
    }),
};

const getByLessonId = {
    params: Joi.object().keys({
        lessonId: Joi.number().integer().required(),
    }),
};

module.exports = {
    updateLesson,
    getById,
    getByLessonId,
};
