const  errorHandler = (err,req,res,next)=>{
    const statusCode= err.statuscode || 500;

    const message = err.message || "Internal server error";


    res.status(statusDode).json({
        status:statusCode,
        success: false,
        message:message,
        errors:err.errors || []
    });
};

export {errorHandler}