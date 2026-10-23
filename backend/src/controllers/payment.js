const asyncHandler = require("../utils/asyncHandler.js");
const Transaction = require("../models/transcationSchema.js")
const { Invitation, Connection } = require("../models/InvitationSchema.js");
const Notification = require("../models/notification.js");
const User = require("../models/user.model.js")


const AddPayment = asyncHandler(async (req, res) => {
    const { _id, amount, type, notes } = req.body
    const user_id = req.user_id

    if (!_id || !amount || !type || !notes) {
        return res.status(401).json({
            message: 'All field required'
        })
    }

    const balance = await Connection.findById({
        merchantId:_id
    })

    if(amount>balance.totalamount){
        return res.status(400).json({
            message:"You can't pay more than Balance"
        })
    }


    await Notification.create({
        
    })

})


module.exports = { AddPayment }