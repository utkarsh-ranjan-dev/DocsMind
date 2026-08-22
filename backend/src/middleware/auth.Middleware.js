export const requireJsonAuth = (req, res, next) => {
    let authObj = req.auth;
    if (typeof req.auth === 'function') {
        authObj = req.auth();
    }
    
    console.log("AUTH DEBUG: authObj = ", authObj);
    if (!authObj || !authObj.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please sign in." });
    }
    
    // Inject userId back so controllers can use it easily as req.auth.userId (like older versions did)
    req.auth = authObj;
    next();
};
