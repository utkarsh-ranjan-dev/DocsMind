export const requireJsonAuth = (req, res, next) => {
    let authObj = req.auth;
    if (typeof req.auth === 'function') {
        authObj = req.auth();
    }
    
    console.log("AUTH DEBUG: authObj = ", authObj);
    if (!authObj || !authObj.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please sign in." });
    }
    
    req.auth = authObj;
    next();
};
