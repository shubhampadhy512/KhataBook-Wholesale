const express = require("express")
const router = express.Router()
const { registerUser,
    registerVerification,
    loginUser,
    logoutUser,
    refreshAccesstoken,
    FindStoremanOrMerchant } = require("../controllers/user.controllers.js")

const { InvitationSend, Listofmessage, UpdateMessage, NormalMessageSeen } = require("../controllers/message.js")
const VerifyUser = require("../middlewar/authVerifiy.js")

router.route("/register").post(registerUser)

router.route("/registerverification").post(registerVerification)

router.route("/login").post(loginUser)

router.route("/logout").post(VerifyUser, logoutUser)

router.route("/refreshacces-token").post(refreshAccesstoken)


router.route("/rolebased-suggestion").get(VerifyUser, FindStoremanOrMerchant)

//Notification

router.route("/invitation").post(VerifyUser, InvitationSend)

router.route("/notification").get(VerifyUser, Listofmessage)

router.route("/updatenotification/:id").patch(VerifyUser, UpdateMessage)

router.route("/handleseenmessage").patch(VerifyUser, NormalMessageSeen)

module.exports = router