const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    otpHash: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 5
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });// MongoDB TTL cleanup

otpSchema.pre("save", async function () {

    console.log(this.otpHash)
    if (!this.isModified("otpHash")) return;
    this.otpHash = await bcrypt.hash(this.otpHash, 10)
});

otpSchema.methods.isOtpMatch = async function (otp) {
    return await bcrypt.compare(String(otp), this.otpHash)
}

module.exports = mongoose.model("Otp", otpSchema);