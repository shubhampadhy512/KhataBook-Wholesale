const asyncHandler = require("../utils/asyncHandler.js");
const Transaction = require("../models/transcationSchema.js")
const { Invitation, Connection } = require("../models/InvitationSchema.js");
const Notification = require("../models/notification.js");
const User = require("../models/user.model.js")
const Payment = require("../models/paymentSchema.js")


const AddTransaction = asyncHandler(async (req, res) => {
    const { merchantId, items, amount, notes, paidamount } = req.body
    const user_id = req.user._id

    if (!merchantId || !user_id || !items || !amount || !notes) {
        return res.status(401).json({
            message: 'All field are required'
        })
    }


    const connection = await Connection.findOne({
        storemanID: user_id,
        merchantId: merchantId
    });


    if (!connection) {
        return res.status(404).json({
            message: 'Something went wrong'
        })
    }
    if (connection.totalamount + Number(amount) < connection.totalpaid + paidamount) {
        return res.status(409).json({
            message: "Paid amount can't be more than the total credit amount."
        })
    }
    connection.totalamount = connection.totalamount + Number(amount);
    connection.totalpaid += paidamount
    await connection.save();

    const status = connection.totalamount - connection.totalpaid === 0 ? 'Approved' : 'Pending'

    const inr = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const user = await User.findById(user_id)
    await Notification.create({
        senderId: user_id,
        sendername: user.username,
        receiverId: merchantId,
        message: `You Purchase some Product amount of ${inr(amount)} from ${String(user.username.charAt(0).toUpperCase() +
            user.username.slice(1))}`,
        type: 'Normal'
    })

    const now = new Date();


    const transaction = await Transaction.create({
        storemanId: user_id,
        merchantId,
        type: 'Purchase',
        items: items,
        amount,
        status,
        paidamount,
        duedate: new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            10
        ),
        description: notes
    })

    await Payment.create({
        storemanId: user_id,
        merchantId,
        status: 'Approve',
        amount: paidamount,
        notes,
        transactionId: transaction._id
    })
    if (!transaction) {
        return res.status(500).json({
            message: 'Something went wrong'
        })
    }


    return res.status(200).json({
        message: 'List is added',
    })
})

const GetdailyTranscation = asyncHandler(async (req, res) => {
    const user_id = req.user._id
    const role = req.user.role
    console.log(role)
    if (role === 'merchant') {

        const formerchant = await Transaction.find({
            merchantId: user_id
        }).sort({ createdAt: -1 })

        if (formerchant.length === 0) {
            const data = await Connection.findOne({ merchantId: user_id })
            const user = await User.findOne(data.storemanID)
            const body = [{
                username: user.username,
                role: user.role,
            }]
            console.log(body)
            return res.status(200).json({
                message: 'No Transcation there',
                body: body
            })
        }

        const storename = await Promise.all(
            formerchant.map(async (user) => {
                const invitation = await User.findOne({
                    _id: user.storemanId
                })
                    .sort({ updatedAt: -1 })
                    .select("username");

                const payment = await Payment.findOne({
                    transactionId: user._id
                })
                    .sort({ updatedAt: -1 })
                    .select("amount");

                return {
                    ...user.toObject(),
                    username: invitation?.username || "",
                    paidamount: payment?.amount || 0
                }
            })
        )

        return res.status(200).json({
            message: 'transcation data',
            body: storename,
            role: role
        })

    }
    const data = await Transaction.find({
        storemanId: user_id
    }).sort({ createdAt: -1 })

    if (data === 0) {
        return res.status(401).json({
            message: 'No Transcation there'
        })
    }

    const merchantdetails = await Promise.all(
        data.map(async (user) => {
            const invitation = await User.findOne({
                _id: user.merchantId
            })
                .sort({ updatedAt: -1 })
                .select("username");

            const payment = await Payment.findOne({
                transactionId: user._id
            })
                .sort({ updatedAt: -1 })
                .select("amount");

            return {
                ...user.toObject(),
                username: invitation?.username || "",
                paidamount: payment?.amount || 0
            }
        })
    )

    const balanceamount = await Connection.find({
        storemanID: user_id
    })

    const mechantdetailsbalance = await Promise.all(
        balanceamount.map(async (data) => {
            const user = await User.findOne(data.merchantId).select("username phonenumber")

            return {
                ...data.toObject(),
                username: user?.username || "",
                phonenumber: user?.phonenumber || ""
            }
        })
    )

    console.log(merchantdetails)

    return res.status(200).json({
        message: 'transcation data',
        body: merchantdetails,
        balance: mechantdetailsbalance,
        role: role,
    })
})

const GetmerchantTransaction = asyncHandler(async (req, res) => {
    const user_id = req.user._id
    const balanceamount = await Connection.find({
        storemanID: user_id
    })
    if (!balanceamount) {
        return res.status(401).json({
            message: 'No connection'
        })
    }
    const merchantdetailsbalance = await Promise.all(
        balanceamount.map(async (data) => {
            const user = await User.findOne(data.merchantId).select("username phonenumber")

            return {
                ...data.toObject(),
                username: user?.username || "",
                phonenumber: user?.phonenumber || ""
            }
        })
    )

    return res.status(200).json({
        message: "This are details",
        body: merchantdetailsbalance
    })
})

module.exports = { AddTransaction, GetdailyTranscation, GetmerchantTransaction }