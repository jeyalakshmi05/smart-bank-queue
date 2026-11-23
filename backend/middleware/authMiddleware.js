
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Please login first"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id)
            .select("-password")
            .populate("counter");

        if (!user) {
            return res.status(401).json({
                message: "User account not found"
            });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired login session"
        });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role !== "Admin") {
        return res.status(403).json({
            message: "Admin access only"
        });
    }
    next();
}

function staffOnly(req, res, next) {
    if (req.user.role !== "Staff" || !req.user.counter) {
        return res.status(403).json({
            message: "Assigned Staff access only"
        });
    }
    next();
}

module.exports = {
    authMiddleware,
    adminOnly,
    staffOnly
};
