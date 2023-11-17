import Product from "../models/productModel.js";
import Cart from "../models/cartModel.js";
export const addCart = async (req, res) => {

    try {
        const userId = req.user._id;
        const { items } = req.body;

        if (req.user.isAdmin) {
            return res.status(400).json({ error: "Admin cannot add a cart" })
        }


        let Price = 0;
        let validProducts = [];
        for (const productItem of items) {
            const { product: productId, quantity } = productItem

            const product = await Product.findById(productId);
            if (!product) {

                return res.status(400).json({ error: "product not found" })
            }
            if (product.stockQuantity === 0) {
                return res.status(400).json({ error: "Product is Out Of Stock" })
            }
            if (product.stockQuantity < quantity) {
                return res.status(400).json({ error: "Requested Quantity is invalid" })
            }


            product.stockQuantity -= quantity;
            await product.save();
            Price += quantity * product.price;
            validProducts.push({ product: productId, quantity });
        }
        const cartAdded = await Cart.create({
            user: userId,
            items: validProducts,
            totalPrice: Price
        })
        await cartAdded.save();
        res.status(201).json({ message: "cart added successfully", cartAdded })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCart = async (req, res) => {
    try {
        const cartId = req.params.cartId; // Assuming your route parameter is cartId
        const { productId, changedQuantity } = req.body;

        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(400).json({ message: "Invalid cart ID" });
        }

        const cartItem = cart.items.find(item => item.product.equals(productId));
        if (!cartItem) {
            return res.status(400).json({ message: "Product not found in cart" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ message: "Product not found" });
        }

        const currentQuantity = cartItem.quantity;

        const quantityDifference = changedQuantity - currentQuantity;

        if (product.stockQuantity + quantityDifference < 0) {
            return res.status(400).json({ message: "Product is out of stock against the requested quantity" });
        }

        cartItem.quantity = changedQuantity;
        product.stockQuantity -= quantityDifference;

        // Recalculate the total price
        cart.totalPrice += quantityDifference * product.price;

        await cart.save();
        await product.save();

        res.status(203).json({ message: "Cart updated successfully", cart });
    } catch (error) {
        res.status(500).json({ message: "Failed to update cart" });
    }
};

export const getAllCarts = async (req, res) => {
    try {
        const { userId } = req.params;

        const carts = await Cart.find({ user: userId }).populate("user", "-password").populate("items.product")
        res.status(200).json(carts);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
export const deleteCart = async (req, res) => {
    try {
        const { cartId } = req.params;

        const cart = await Cart.findByIdAndDelete(cartId);


        if (!cart) {
            return res.status(400).json({ message: "Cart not found" })
        }
        for (const productItems of cart.items) {

            const productId = productItems.product._id;
            const product = await Product.findById(productId);
            product.stockQuantity += productItems.quantity;
            await product.save();

        }
        res.status(203).json({ message: "cart deleted", cart })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
export const deleteProductsFromCart = async (req, res) => {
    try {
        const { cartId } = req.params;
        const { productIds } = req.body;

        const cart = await Cart.findById(cartId);

        if (!cart) {
            return res.status(400).json({ message: "Cart not found" });
        }

        let totalPriceChange = 0; // Initialize a variable to track the change in total price

        // Track the products that were successfully removed
        const removedProductIds = [];

        for (const productId of productIds) {
            const productItem = cart.items.find(item => item.product.toString() === productId);

            if (!productItem) {
                return res.status(400).json({ message: `Product with ID ${productId} not found in the cart` });
            }

            const product = await Product.findById(productId);

            if (!product) {
                return res.status(400).json({ message: `Product with ID ${productId} not found` });
            }

            // Calculate the change in total price before removing the product
            totalPriceChange -= productItem.quantity * product.price;

            // Increase the stockQuantity by the quantity of the product being removed
            product.stockQuantity += productItem.quantity;
            await product.save();

            // Remove the product from the cart's items
            cart.items.pull({ product: productId });
            removedProductIds.push(productId);
        }

        // Update the cart's total price by adding the calculated change
        cart.totalPrice += totalPriceChange;

        await cart.save();

        if (cart.items.length === 0) {
            // If no more items, delete the cart
            await Cart.findByIdAndDelete(cartId);
            return res.status(204).json({ message: "Products deleted from the cart, and the cart is now empty" });
        }

        return res.status(200).json({ message: "Products deleted from the cart", removedProductIds });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const products = async (req, res) => {
    try {
        const allProducts = await Product.find();
        res.status(200).json(allProducts);
    } catch (error) {
        res.status(400).json({ message: error.message })
    }

}
export const getSingleProduct = async (req, res) => {
    const { productId } = req.params

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ message: "Invalid Product Id" })
        }
        res.status(200).json(product)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
