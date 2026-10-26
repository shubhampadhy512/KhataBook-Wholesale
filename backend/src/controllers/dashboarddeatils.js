const asyncHandler = require("../utils/asyncHandler.js")
const User = require("../models/user.model.js")
const { sendOtp } = require("../utils/sendotp.js");
const OtpSchema = require("../models/OtpSchema.js");
const { Invitation, Connection } = require("../models/InvitationSchema.js")
const Transaction = require("../models/transcationSchema.js")
const Payment = require("../models/paymentSchema.js")


const GetDashboardDetails = asyncHandler(async (req, res) => {
    // {
    //     "body": {
    //         "merchant": {
    //             "name": "ramesh",
    //                 "store": "Ramesh General Store"
    //         },
    //         "summary": {
    // "totalCredit": 150000,
    //     "totalPaid": 90000,
    //         "outstanding": 60000
    //         },
    //         "submissions": [
    //             {
    //                 "id": "PAY-1001",
    //                 "amount": 5000,
    //                 "method": "UPI",
    //                 "reference": "412345678901",
    //                 "submittedAt": "26 Oct 2026, 3:45 PM",
    //                 "status": "pending"
    //             },
    //             {
    //                 "id": "PAY-1000",
    //                 "amount": 12000,
    //                 "method": "Bank Transfer",
    //                 "reference": "UTR98765432",
    //                 "submittedAt": "25 Oct 2026, 11:10 AM",
    //                 "status": "verified"
    //             }
    //         ]
    //     }
    // }
    const { _id, username, role } = req.user

    if (role === 'merchant') {
        const balances = await Connection.findOne({
            merchantId: _id
        })
        if (!balances) {
            return res.status(401).json({
                message: 'There is no data'
            })
        }

        const storeman = await User.findById(balances.storemanID).select("username")
        const merchant = await User.findById(_id).select("username")
        const payment = await Payment.find({
            merchantId: _id
        }).select("status createdAt notes amount paymentType")

        return res.status(200).json({
            message: 'Done',
            body: {
                merchant: {
                    name: merchant.username,
                    store: storeman.username
                },
                summary: {
                    totalCredit: balances.totalamount,
                    totalPaid: balances.totalpaid,
                    outstanding: balances.totalamount - balances.totalpaid
                },
                submissions: payment
            }
        })
    }

    const balances = await Connection.find({
        storemanID: _id
    }).select("totalamount totalpaid")


    if (balances.length === 0) {
        return res.status(401).json({
            message: 'Nothing is there'
        })
    }

    let alltotalamount = 0
    let alltotalpaid = 0

    balances.map((user) => {
        alltotalamount += user.totalamount,
            alltotalpaid += user.totalpaid
    })

    const now = new Date();
    const chart = [];

    for (let i = 6; i >= 0; i--) {
        const start = new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1
        );

        const end = new Date(
            now.getFullYear(),
            now.getMonth() - i + 1,
            1
        );

        const count = await Transaction.find({
            createdAt: {
                $gte: start,
                $lt: end
            }
        });

        let credit = 0;
        let payments = 0;
        count.map((user) => {
            credit += user?.amount || 0,
                payments += user.paidamount || 0
        })
        chart.push({
            month: start.toLocaleString("en-IN", { month: "short" }),
            year: start.getFullYear(),
            credit,
            payments
        });
    }

    return res.status(200).json({
        message: 'Dashboard data',
        body: {
            username: username,
            stats: {
                totalCredit: alltotalamount,
                paymentsReceived: alltotalpaid,
                outstanding: alltotalamount - alltotalpaid,
                merchants: balances.length
            },
            chart
        }
    })

})


module.exports = { GetDashboardDetails }