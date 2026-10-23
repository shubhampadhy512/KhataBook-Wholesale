const asyncHandler = require("../utils/asyncHandler.js");
const Transaction = require("../models/transcationSchema.js")
const { Invitation, Connection } = require("../models/InvitationSchema.js");
const Notification = require("../models/notification.js");
const User = require("../models/user.model.js")
const mongoose = require("mongoose")


const AddTransaction = asyncHandler(async (req, res) => {
    const { merchantId, items, amount, notes } = req.body
    const user_id = req.user._id

    console.log("Storeman ID:", user_id);
    console.log("Merchant ID:", merchantId);
    if (!merchantId || !user_id || !items || !amount || !notes) {
        return res.status(401).json({
            message: 'All field are required'
        })
    }

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


    const connection = await Connection.findOne({
        storemanId: user_id,
        merchantId: merchantId
    });

    console.log(connection, merchantId, user_id)

    if (!connection) {
        return res.status(404).json({
            message: 'Something went wrong'
        })
    }
    connection.totalamount += Number(amount);
    await connection.save();


    const transaction = await Transaction.create({
        storemanId: user_id,
        merchantId,
        type: 'Purchase',
        items: items,
        amount,
        duedate: new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            10
        ),
        description: notes
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
    if (role === 'merchant') {
        const formerchant = await Transaction.find({
            merchantId: user_id
        }).sort({ createdAt: -1 })

        if (formerchant === 0) {
            return res.status(401).json({
                message: 'No Transcation there'
            })
        }

        const storename = await Promise.all(
            formerchant.map(async (user) => {
                const invitation = await User.findOne({
                    _id: user.storemanId
                })
                    .sort({ updatedAt: -1 })
                    .select("username");

                return {
                    ...user.toObject(),
                    username: invitation?.username || "",
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

            return {
                ...user.toObject(),
                username: invitation?.username || "",
            }
        })
    )

    return res.status(200).json({
        message: 'transcation data',
        body: merchantdetails,
        role: role
    })
})

module.exports = { AddTransaction, GetdailyTranscation }