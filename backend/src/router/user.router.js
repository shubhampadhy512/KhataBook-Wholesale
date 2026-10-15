const express = require("express")
const router = express.Router()
const { registerUser, registerVerification, loginUser, profileUser } = require("../controllers/user.controllers.js")


router.route("/register").post(registerUser)

router.route("/registerverification").post(registerVerification)

router.route("/login").post(loginUser)

router.route("/profile").post(profileUser)

module.exports = router