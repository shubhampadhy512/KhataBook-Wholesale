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

    const checkPaymentVerification = await Payment.find({
        storemanId: user_id,
        merchantId: merchantId,
        status: 'Pending'
    })

    console.log(checkPaymentVerification)

    if (checkPaymentVerification.length >0) {
        return res.status(401).json({
            meassage: 'First check the payment Verification'
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
        status: 'Approve',
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

    const { reference, amount, paymentMode } = req.body
    const user_id = req.user._id
    const username = req.user.username

    console.log(reference, amount, paymentMode)
    const balance = await Connection.findOne({
        merchantId: user_id
    })

    if (balance.totalamount - balance.totalpaid < amount) {
        return res.status(401).json({
            message: 'Avaiable Amount is greate than Balances Amount'
        })
    }

    const inr = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    await Notification.create({
        senderId: user_id,
        sendername: username,
        receiverId: balance.storemanID,
        message: `You paid ${inr(amount)} to ${String(username.charAt(0).toUpperCase() +
            username.slice(1))}`,
        type: 'Payment'
    })


    const transaction = await Transaction.create({
        storemanId: balance.storemanID,
        merchantId: user_id,
        type: "Payment",
        paidamount: amount,
        status: 'Pending',
        paymentMode: paymentMode,
        transactionId: reference
    })
    const payment = await Payment.create({
        transactionId: transaction._id,
        storemanId: balance.storemanID,
        merchantId: user_id,
        paymentType: paymentMode,
        status: 'Pending',
        amount: amount,
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

const getPendingPayment = asyncHandler(async (req, res) => {
    const user_id = req.user._id

    const transcation = await Payment.find({
        storemanId: user_id,
        status: 'Pending'
    }).sort({ createdAt: -1 })

    return res.status(200).json({
        message: 'This is data',
        body: transcation
    })
})

const HandlePayment = asyncHandler(async (req, res) => {
    const { id, status } = req.body;
    const storemanId = req.user._id;
    const username = req.user.username;

    const inr = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    if (!id || !["verified", "rejected"].includes(status)) {
        return res.status(400).json({
            message: "Invalid payment ID or status"
        });
    }

    const detailsPayment = await Payment.findById(id);

    if (!detailsPayment) {
        return res.status(404).json({
            message: "Invalid payment transaction"
        });
    }

    // Find the connection using the storeman's USER ID.
    const balance = await Connection.findOne({
        storemanID: storemanId,
        merchantId: detailsPayment.merchantId
    });

    if (!balance) {
        return res.status(404).json({
            message: "No connection found with this merchant"
        });
    }

    // Prevent processing an already decided payment.
    if (detailsPayment.status !== "Pending") {
        return res.status(400).json({
            message: "This payment has already been processed"
        });
    }

    const transaction = await Transaction.findById(
        detailsPayment.transactionId
    );

    if (!transaction) {
        return res.status(404).json({
            message: "Related transaction not found"
        });
    }

    const displayName =
        username.charAt(0).toUpperCase() + username.slice(1);

    if (status === "rejected") {
        detailsPayment.status = "Reject";
        transaction.status = "Reject";

        await detailsPayment.save();
        await transaction.save();

        await Notification.create({
            senderId: storemanId,
            sendername: username,
            receiverId: detailsPayment.merchantId,
            message: `Your payment of ${inr(detailsPayment.amount)} was rejected by ${displayName}`,
            type: "Normal"
        });

        return res.status(200).json({
            message: "Payment rejected",
            status: "rejected"
        });
    }

    // Calculate the outstanding amount.
    const outstanding =
        balance.totalamount - balance.totalpaid;

    if (detailsPayment.amount > outstanding) {
        return res.status(400).json({
            message: "Payment exceeds the outstanding balance"
        });
    }

    // A payment increases totalpaid, not totalamount.
    balance.totalpaid += detailsPayment.amount;

    detailsPayment.status = "Approve";
    transaction.status = "Approve";

    await balance.save();
    await detailsPayment.save();
    await transaction.save();

    await Notification.create({
        senderId: storemanId,
        sendername: username,
        receiverId: detailsPayment.merchantId,
        message: `Your payment of ${inr(detailsPayment.amount)} was approved by ${displayName}`,
        type: "Normal"
    });

    return res.status(200).json({
        message: "Payment approved successfully",
        status: "verified"
    });
});

module.exports = { AddPayment, GetPaymentHistory, SubmitPayment, getPendingPayment, HandlePayment }