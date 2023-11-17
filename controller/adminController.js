
import Product from "../models/productModel.js";


export const addProduct = async (req, res) => {
    try {


        const { adminId } = req.params
        const { title, description, picture, price, category, stockQuantity, shippingType, vendor, offer } = req.body;
        const createdBy = adminId
        if (!title || !description || !picture || !price || !stockQuantity || !category || !vendor) {
            return res.status(400).json({ message: "All fields are mandatory to be filled" })
        }

        const product = new Product({
            title,
            description,
            picture,
            price,
            category,
            shippingType,
            vendor,
            stockQuantity,
            offer,
            createdBy,
            publishedDate: new Date().toLocaleString('en-US', {
                year: "numeric",
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            }),
        })
        await product.populate("createdBy", "fullname email picture")
        await product.save();

        res.status(201).json({ product });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add a new product' });
    }

}
export const editProduct = async (req, res) => {
    try {

        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Unauthorized. Only admins can perform this action.' });
        }

        const { productId } = req.params;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }


        product.title = req.body.title || product.title;
        product.description = req.body.description || product.description;
        product.picture = req.body.picture || product.picture;
        product.price = req.body.price || product.price;
        product.category = req.body.category || product.category;
        product.stockQuantity = req.body.stockQuantity || product.stockQuantity;
        product.shippingType = req.body.shippingType || product.shippingType;
        product.offer = req.body.offer || product.offer;
        product.vendor = req.body.vendor || product.vendor;


        await product.save();
        res.json({ message: 'Product updated successfully', product });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update the product' });
    }


}
export const deleteProduct = async (req, res) => {
    try {

        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Unauthorized. Only admins can perform this action.' });
        }

        const { productId } = req.params;


        const product = await Product.findByIdAndDelete(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }



        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete the product' });
    }
}
export const listAllProducts = async (req, res) => {

    const { adminId } = req.params;

    try {
        const products = await Product.find({ createdBy: adminId });
        if (!products) {
            return res.status(400).json({ message: "No products found by this user" })
        }
        const adminIds = products.map(product => product.createdBy)
        const populatedProducts = await Product.find({ createdBy: { $in: adminIds } })
            .populate("createdBy", "fullname email picture")
        res.status(200).json({ products: populatedProducts })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }

}


