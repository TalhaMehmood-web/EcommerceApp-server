import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import User from "../models/UserModel.js"
export const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { cartIds, paymentMethod, shippingAddress, deliverType } = req.body;

        const orders = [];

        for (const cartId of cartIds) {
            const cart = await Cart.findById(cartId);

            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            if (deliverType === "Two days Shipping") {
                cart.totalPrice += 20;
            } else if (deliverType === "Standard Shipping") {
                cart.totalPrice += 10;
            } else if (deliverType === "One day Shipping") {
                cart.totalPrice += 30;
            }

            await cart.save();
            const order = await Order.create({
                user: userId,
                cartOrders: [
                    {
                        cart: cartId,
                        products: cart.items,
                        totalPrice: cart.totalPrice
                    }
                ],
                paymentMethod,
                shippingAddress,
                deliverType,
                orderStatus: 'Pending',
                orderDate: new Date()
            });

            cart.items = [];
            cart.totalPrice = 0;
            await cart.save();

            // Extract totalPrice from cartOrders
            const totalPrice = order.cartOrders[0].totalPrice;

            // Create a response order object with totalPrice included
            const responseOrder = {
                user: order.user,
                paymentMethod: order.paymentMethod,
                shippingAddress: order.shippingAddress,
                deliverType: order.deliverType,
                orderStatus: order.orderStatus,
                orderDate: order.orderDate,
                totalPrice: totalPrice,
                _id: order._id,
                cartOrders: order.cartOrders,
                __v: order.__v
            };

            orders.push(responseOrder);
        }

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No valid carts found' });
        }

        res.status(201).json({ message: 'Orders placed successfully', orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const getOrderHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const orders = await Order.find({ user: userId })
            .sort({ orderDate: -1 })
            .populate('user', '-password')
            .populate('cartOrders.products.product');

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.orderId;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.orderStatus !== 'Pending') {
            return res.status(400).json({ message: 'Only pending orders can be canceled' });
        }


        order.orderStatus = 'Cancelled';


        for (const productItem of order.products) {
            const productId = productItem.product;
            const quantity = productItem.quantity;


            const product = await Product.findById(productId);

            if (product) {

                product.stockQuantity += quantity;
                await product.save();
            }
        }

        await order.save();

        res.status(200).json({ message: 'Order canceled successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel the order' });
    }
};
export const getAllOrders = async (req, res) => {
    const { adminId } = req.params;

    try {

        const productsOfAdmin = await Product.find({ createdBy: adminId });
        const productsID = productsOfAdmin.map(product => product._id);

        // Find orders that contain the admin's products.
        const orders = await Order.find({ "cartOrders.products.product": { $in: productsID } })
            .populate('user', '-password')
            .populate("cartOrders.products.product")

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied. Only admin users can access this route.' });
        }
        const { orderId } = req.params;
        const { orderStatus } = req.body;

        const order = await Order.findByIdAndUpdate(orderId, { orderStatus }, { new: true })
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const allCustomers = async (req, res) => {
    try {
        const { adminId } = req.params;

        // Find products created by the admin.
        const productsOfAdmin = await Product.find({ createdBy: adminId });
        const productsID = productsOfAdmin.map(product => product._id);

        // Find orders that contain the admin's products.
        const orders = await Order.find({ "cartOrders.products.product": { $in: productsID } });

        // Extract unique user IDs from the orders.
        const userIds = Array.from(new Set(orders.map(order => order.user._id)));

        // Find user details based on the user IDs.
        const users = await User.find({ _id: { $in: userIds } });


        const responseData = users.map(user => {
            const userOrders = orders.filter(order => order.user.toString() === user._id.toString());
            const orderCount = userOrders.length;
            return {
                user: user.toObject(),
                orderCount,
                totalOrderPrice: userOrders.reduce((sum, order) =>
                    sum + order.cartOrders.reduce((orderSum, cart) => orderSum + cart.totalPrice, 0), 0)
            };
        });

        if (!responseData) {
            return res.status(400).json({ message: "Users not found" });
        }

        res.status(200).json(responseData);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
