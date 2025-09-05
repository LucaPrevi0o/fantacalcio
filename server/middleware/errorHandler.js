// server/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error response
    let status = 500;
    let message = 'Internal Server Error';

    // Handle specific error types
    if (err.type === 'validation') {
        status = 400;
        message = err.message || 'Validation Error';
    } else if (err.type === 'not_found') {
        status = 404;
        message = err.message || 'Resource Not Found';
    }

    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

//module.exports = errorHandler;
export default errorHandler;