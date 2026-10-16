const express = require("express")
const router = express.Router()
const { registerUser, registerVerification, loginUser, logoutUser, refreshAccesstoken } = require("../controllers/user.controllers.js")
const VerifyUser = require("../middlewar/authVerifiy.js")


router.route("/register").post(registerUser)

router.route("/registerverification").post(registerVerification)

router.route("/login").post(loginUser)

router.route("/logout").post(VerifyUser, logoutUser)

router.route("/refreshacces-token").post(refreshAccesstoken)

module.exports = router