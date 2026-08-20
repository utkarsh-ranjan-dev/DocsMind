class ApiError extends Error {
    constructor(statusCode, message="Something went wrong0.", error=[])
    {
        super(message)
        this.mesage=message
        this.statusCode= statusCode
        this.errror= error
        this.success=false
        this.data=null

    }
}

export {ApiError}
