const asyncHandler = require("../utils/asyncHandler.js");
const Transaction = require("../models/transcationSchema.js")
const { Invitation, Connection } = require("../models/InvitationSchema.js");
const Notification = require("../models/notification.js");
const User = require("../models/user.model.js")
const Payment = require("../models/paymentSchema.js")


const GetPaymentHistory = asyncHandler(async (req, res) => {
    const user_id = req.user_id

    const data = await Payment.find({
        storemanId: user_id
    }).sort({ createdAt: -1 })

    return res.status(200).json({
        message: 'Add the payment',
        body: data
    })

})

const AddPayment = asyncHandler(async (req, res) => {
    const { amount, type, notes } = req.body
    const merchantId = req.body._id
    const user_id = req.user._id
    const username = req.user.username


    if (!merchantId || !amount || !type || !notes || !username) {
        return res.status(401).json({
            message: 'All field required'
        })
    }

    const balance = await Connection.findOne({ merchantId: merchantId })

    console.log(merchantId, amount, type, notes,balance)
    if (!balance) {
        return res.status(401).json({
            message: 'Invalid Merchant'
        })
    }
    if (amount > balance.totalamount) {
        return res.status(400).json({
            message: "You can't pay more than Balance"
        })
    }


    await Notification.create({
        senderId: user_id,
        sendername: username,
        receiverId: merchantId,
        message: `You Purchase some Product amount of ${inr(amount)} from ${String(username.charAt(0).toUpperCase() +
            username.slice(1))}`,
        type: 'Normal'
    })

    const payment = await Payment.create({
        storemanId: user_id,
        merchantId: merchantId,
        paymentType: type,
        status: 'Approve',
        amount: amount,
        notes: notes
    })

    if (!payment) {
        return res.status(500).json({
            message: 'Something went, try again later'
        })
    }

    return res.status(200).json({
        message: 'Add the payment'
    })

})


module.exports = { AddPayment, GetPaymentHistory }