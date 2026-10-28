const Product = require("../models/productSchema")
const asyncHandler = require("../utils/asyncHandler")

const getProductList = asyncHandler(async (req, res) => {
    const user_id = req.user._id

    const listofproduct = await Product.find({
        storemanId: user_id
    })

    if (!listofproduct) {
        return res.status(400).json({
            message: 'No product list is there'
        })
    }

    return res.status(200).json({
        message: "List of product",
        info: listofproduct
    })
})

const AddProduct = asyncHandler(async (req, res) => {

    const { productname, category, unit, price, emoji } = req.body
    const user_id = req.user._id

    if (!productname || !category || !unit || !price || !emoji) {
        return res.status(400).json({
            message: 'All field required'
        })
    }

    await Product.create({
        storemanId: user_id,
        productname,
        category,
        unit,
        price,
        emoji,
    })

    return res.status(200).json({
        message: `Added ${productname} to you list`
    })

})

const RemoveProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
        return res.status(404).json({
            message: "Product not found",
        });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
        message: "Product deleted successfully",
    });

})

const UpdateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { productname, category, unit, price, emoji } = req.body

    const product = await Product.findById(id);

    if (!product) {
        return res.status(404).json({
            message: "Product not found",
        });
    }
    if (product.productname === name && product.category === category && product.unit === unit && product.price === price && product.emoji === emoji) {
        return res.status(401).json({
            message: 'Nothing you have changed'
        })
    }

    await Product.findByIdAndUpdate(id, {
        productname,
        category,
        price,
        unit,
        emoji
    });

    return res.status(200).json({
        message: "Product deleted successfully",
    });

})


module.exports = { getProductList, AddProduct, RemoveProduct, UpdateProduct }