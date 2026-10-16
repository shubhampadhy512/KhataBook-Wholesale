const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.model.js")

const VerifyUser = asyncHandler(async (req, res, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ", "")
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized Request"
            })
        }

        const decode = await jwt.verify(token, ACCESS_TOKEN_SECRET)
        if (!decode._id) {
            return res.status(401).json({
                message: "Invalid access token"
            });
        }

        const user = await User.findById(decode._id).select("-password -refreshToken")

        if (!user) {
            return res.status(401).json({
                message: "User not found or token is invalid"
            });
        }

        req.body = user
        next()
    } catch (error) {
        return res.status(401).json({
            message: `Invalid Access Token`
        })
    }
})

module.exports = VerifyUser