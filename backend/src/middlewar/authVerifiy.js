const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.model.js")

const VerifyUser = asyncHandler(async (req, res, next) => {

    try {
        const authorization = req.header("Authorization")
        const token = req.cookies?.accessToken || authorization?.replace(/^Bearer\s+/i, "")
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized Request"
            })
        }

        const decode = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        if (!decode._id) {
            return res.status(401).json({
                message: "Invalid access token"
            });
        }

        const newuser = await User.findById(decode._id).select("-password -refreshToken")

        if (!newuser) {
            return res.status(401).json({
                message: "User not found or token is invalid"
            });
        }

        req.user = newuser
        next()
    } catch (error) {
        return res.status(401).json({
            message: `Invalid Access Token`
        })
    }
})

module.exports = VerifyUser