const asyncHandler = require("../utils/asyncHandler.js");
const Transaction = require("../models/transcationSchema.js")
const { Invitation, Connection } = require("../models/InvitationSchema.js");
const Notification = require("../models/notification.js");
const User = require("../models/user.model.js")


const AddTransaction = asyncHandler(async (req, res) => {
    const { merchantId, items, amount, notes } = req.body
    const user_id = req.user._id

    if (!merchantId || !user_id || !items || !amount || !notes) {
        return res.status(401).json({
            message: 'All field are required'
        })
    }
    const now = new Date();

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

    await Connection.findOneAndUpdate(
        {
            storemanId: user_id,
            merchantId: merchantId
        }, {
        $inc: {
            totalamount: amount
        }
    }, { returnDocument: 'after' }
    )

    return res.status(200).json({
        message: 'List is added',
    })
})

const GetdailyTranscation = asyncHandler(async (req, res) => {
    const user_id = req.user._id
    console.log(user_id)
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
    console.log(merchantdetails)
    return res.status(200).json({
        message: 'transcation data',
        body: merchantdetails,

    })
})

module.exports = { AddTransaction, GetdailyTranscation }