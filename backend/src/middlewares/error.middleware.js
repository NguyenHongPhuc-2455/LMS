/**
 * Centralized Error Handling Middleware
 */
const errorMiddleware = (err, req, res, next) => {
    let { statusCode, message } = err;

    // Nếu lỗi không phải từ ApiError, mặc định là 500 (Server Error)
    if (!statusCode) {
        statusCode = 500;
    }

    const response = {
        code: statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };

    if (process.env.NODE_ENV === 'development') {
        console.error(`[Error] ${statusCode} - ${message}`);
    }

    res.status(statusCode).send(response);
};

module.exports = errorMiddleware;
