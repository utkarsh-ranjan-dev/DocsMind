const errorHandler = (err, req, res, next) => {
    console.error("BACKEND ERROR:", err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error";

    res.status(statusCode).json({
        status: statusCode,
        success: false,
        message: message,
        errors: err.errors || []
    });
};

export { errorHandler }
