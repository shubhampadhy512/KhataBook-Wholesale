const mongoose = require("mongoose")

const ProductList = await mongoose.Schema({
    storemanId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    product: [
        {
            productname: {
                type: String,
                trim: true,
                required:true
            },
            qunantity:{
                type:Number,
                default:0
            }
        }
    ]
})