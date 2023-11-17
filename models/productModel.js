import mongoose from "mongoose";
const productSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    picture: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
    },
    stockQuantity: {
        type: Number,
        required: true,
    },
    shippingType: {
        type: Boolean,
        required: true,
        default: true
    },
    vendor: {
        type: String,
        required: true
    },
    offer: {
        type: Number,
        default: 0,

    },
    publishedDate: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true,
    },
})

const Product = mongoose.model("Product", productSchema)
export default Product;