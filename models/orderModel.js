import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cartOrders: [
        {
            cart: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Cart',
                required: true,
            },
            products: [
                {
                    product: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Product',
                        required: true,
                    },
                    quantity: {
                        type: Number,
                        required: true,
                        min: 1,
                    },
                },
            ],
            totalPrice: {
                type: Number,
                required: true,
            },
        },
    ],
    paymentMethod: {
        type: String,
        required: true,
    },
    shippingAddress: {
        type: String,
        required: true,
    },
    deliverType: {
        type: String,
        enum: ["Free Shipping", "Two days Shipping", "Standard Shipping", "One day Shipping"],
        default: "Free Shipping",
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending',
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
