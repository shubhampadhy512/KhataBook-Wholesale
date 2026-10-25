const express = require("express")
const router = express.Router()
const { registerUser,
    registerVerification,
    loginUser,
    logoutUser,
    refreshAccesstoken,
    FindStoremanOrMerchant,
    resendOtp,
    ResetPassword,
    VerifyOtp,
    Changepass_validateEmail, getMerchantdetails, getUserdetails } = require("../controllers/user.controllers.js")

const { InvitationSend, Listofmessage, UpdateMessage, NormalMessageSeen } = require("../controllers/message.js")
const { AddTransaction, GetdailyTranscation, GetmerchantTransaction } = require('../controllers/transaction.js')
const { AddPayment, GetPaymentHistory } = require("../controllers/payment.js")
const VerifyUser = require("../middlewar/authVerifiy.js")

router.route("/register").post(registerUser)

router.route("/registerverification").post(registerVerification)

router.route("/login").post(loginUser)

router.route("/logout").post(VerifyUser, logoutUser)

router.route("/refreshacces-token").post(refreshAccesstoken)

router.route("/forgot-password/send-otp").post(Changepass_validateEmail)

router.route("/forgot-password/verify-otp").post(VerifyOtp)

router.route("/forgot-password/reset").post(ResetPassword)

router.route("/resendOtp").post(resendOtp)

router.route("/user").get(VerifyUser, getUserdetails)

router.route("/merchantsdetails").get(VerifyUser, getMerchantdetails)

router.route("/rolebased-suggestion").get(VerifyUser, FindStoremanOrMerchant)

//Notification

router.route("/invitation").post(VerifyUser, InvitationSend)

router.route("/notification").get(VerifyUser, Listofmessage)

router.route("/updatenotification/:id").patch(VerifyUser, UpdateMessage)

router.route("/handleseenmessage").patch(VerifyUser, NormalMessageSeen)

//Transaction

router.route("/addtransactionpurchase").post(VerifyUser, AddTransaction)

router.route("/daily-transcation").get(VerifyUser, GetdailyTranscation)


//Payment

router.route("/getpayment").get(VerifyUser, GetPaymentHistory)

router.route("/addpayment").post(VerifyUser, AddPayment)

router.route("/getmerchantbalance").get(VerifyUser, GetmerchantTransaction)



module.exports = router