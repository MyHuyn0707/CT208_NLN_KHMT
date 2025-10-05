/**
 * Middleware xử lý lỗi chung cho toàn bộ ứng dụng
 * Đảm bảo format lỗi trả về nhất quán
 *
 * @param {Error} err - Đối tượng lỗi
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */

export const errorHandler = (err, req, res, next) => {
    console.error("API Error:", err);

    // Default status code: 500
    const statusCode = err.statusCode || 500;

    const errorResponse = {
        error: {
            message: err.message || "Internal server error",
            type: err.name || "ServerError",
        },
    };

    // Add development env error
    if (process.env.NODE_ENV === "development") {
        errorResponse.error.stack = err.stack;
        errorResponse.error.details = err.details || {};
    }

    // Trả về response với định dạng nhất quán
    res.status(statusCode).json(errorResponse);
};

/**
 * Middleware xử lý 404 khi không tìm thấy route
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */

export const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: {
            message: `Cannot ${req.method} ${req.originalUrl}`,
            type: "NotFoundError",
        },
    });
};

/**
 * Middleware tạo lớp bọc cho async handler để tự động xử lý lỗi
 *
 * @param {Function} fn - Async function handler
 * @returns {Function} - Middleware function với xử lý lỗi
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
