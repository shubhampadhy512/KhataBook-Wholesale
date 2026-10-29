const asyncHandler = require("../utils/asyncHandler.js")
const User = require("../models/user.model.js")
const { sendOtp } = require("../utils/sendotp.js");
const OtpSchema = require("../models/OtpSchema.js");
const { Invitation, Connection } = require("../models/InvitationSchema.js")
const Transaction = require("../models/transcationSchema.js")
const Payment = require("../models/paymentSchema.js")


const GetDashboardDetails = asyncHandler(async (req, res) => {

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

        const storeman = await User.findById(balances.storemanID).select("username storename addresses phonenumber")
        const payment = await Payment.find({
            merchantId: _id,
        }).select("status createdAt notes amount paymentType")

        return res.status(200).json({
            message: 'Done',
            body: {
                merchant: {
                    name: username,
                    store: storeman.storename || storeman.username,
                    addresses: storeman.addresses,
                    phonenumber: storeman.phonenumber,
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

        const approvedPayments = await Payment.find({
            storemanId: _id,
            status: "Approve",
            createdAt: {
                $gte: start,
                $lt: end
            }
        });

        let credit = 0;
        let payments = 0;

        count.forEach((transaction) => {
            if (transaction.type === "Purchase") {
                credit += transaction.amount || 0;
            }
        });

        approvedPayments.forEach((payment) => {
            payments += payment.amount || 0;
        });

        chart.push({
            month: start.toLocaleString("en-IN", {
                month: "short"
            }),
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