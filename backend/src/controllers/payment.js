const asyncHandler = require("../utils/asyncHandler.js");
const Transaction = require("../models/transcationSchema.js")
const { Invitation, Connection } = require("../models/InvitationSchema.js");
const Notification = require("../models/notification.js");
const User = require("../models/user.model.js")
const Payment = require("../models/paymentSchema.js")


const GetPaymentHistory = asyncHandler(async (req, res) => {
    const user_id = req.user._id
    const role = req.user.role

    if (role === 'merchant') {
        const data = await Payment.find({
            merchantId: user_id
        }).sort({ createdAt: -1 })

        return res.status(200).json({
            message: 'Add the payment',
            body: data
        })
    }

    const data = await Payment.find({
        storemanId: user_id
    }).sort({ createdAt: -1 })


    const alldata = await Promise.all(
        data.map(async (data) => {
            const user = await User.findOne(data.merchantId).sort({ updatedAt: -1 }).select("username phonenumber")

            return {
                ...data.toObject(),
                username: user?.username || '',
                phonenumber: user?.phonenumber || ''
            }
        })
    )
    return res.status(200).json({
        message: 'Add the payment',
        body: alldata
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

    if (!balance) {
        return res.status(401).json({
            message: 'Invalid Merchant'
        })
    }
    if (amount > balance.totalamount - balance.totalpaid) {
        return res.status(400).json({
            message: "You can't pay more than Balance"
        })
    }

    balance.totalpaid += amount;
    balance.save()
    const inr = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    await Notification.create({
        senderId: user_id,
        sendername: username,
        receiverId: merchantId,
        message: `You paid ${inr(amount)} to ${String(username.charAt(0).toUpperCase() +
            username.slice(1))}`,
        type: 'Normal'
    })


    const transaction = await Transaction.create({
        storemanId: user_id,
        merchantId: merchantId,
        type: "Payment",
        paidamount: amount,
        paymentMode: type,
        description: notes,
    })
    const payment = await Payment.create({
        transactionId: transaction._id,
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

const SubmitPayment = asyncHandler(async (req, res) => {
    
})


module.exports = { AddPayment, GetPaymentHistory }