import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import crypto from "crypto";
import nodemailer from "nodemailer";

let createToken = (_id, fullname, username, email, picture, isAdmin) => {
    const payload = {
        _id: _id,
        fullname: fullname,
        username: username,
        email: email,
        picture: picture,
        isAdmin: isAdmin
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
};
export const signUp = async (req, res) => {
    const { fullname, username, email, password, picture, isAdmin } = req.body
    if (!fullname || !username || !password || !email) {
        return res.status(400).json("Please fill all the fields ")
    }

    const exists = await User.findOne({ email })
    if (exists) {
        return res.status(400).json("Email already exist")
    }
    const findByUsername = await User.findOne({ username })
    if (findByUsername) {
        return res.status(400).json("Username already exist")
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json("Not a valid email format")
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    try {
        const user = await User.create({
            fullname,
            username,
            email,
            password: hash,
            picture,
            isAdmin

        })

        await user.save();
        res.status(201).json({
            _id: user._id,
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            password: user.password,
            picture: user.picture,
            isAdmin: user.isAdmin,
            token: createToken(user._id, user.fullname, user.username, user.email, user.picture, user.isAdmin),
            message: "Registration Successful"
        })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
export const login = async (req, res) => {

    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json("All fields are mandatory to be field");
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json("Incorrect Email")
        }
        const matchPassword = await bcrypt.compare(password, user.password)
        if (!matchPassword) {
            return res.status(400).json("Incorrect password ")
        }


        const success = "successfully logged in"
        res.status(201).json({
            _id: user._id,
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            password: user.password,
            picture: user.picture,
            isAdmin: user.isAdmin,
            token: createToken(user._id, user.fullname, user.username, user.email, user.picture, user.isAdmin),
            success,
        })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
export const updateProfile = async (req, res) => {
    const { userId } = req.params
    try {
        const { fullname, username, password, isAdmin, email, picture } = req.body;

        if (!email && !validator.isEmail(email)) {
            return res.status(400).json({ error: "invalid email format" })
        }

        const user = await User.findById(userId);

        if (!user) {
            res.status(400).json({ error: "user not found" })
        }

        if (fullname) user.fullname = fullname;
        if (username) user.username = username;
        if (email) user.email = email;
        if (password) user.password = password;
        if (picture) user.picture = picture;
        if (isAdmin) user.isAdmin = isAdmin;

        await user.save();
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update profile' });
    }
}
export const changePassword = async (req, res) => {
    const { userId } = req.params;
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: "user not found" });
        }
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ error: "All fields are mandatory to be filled" })
        }
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(400).json({ error: "Current Password is incorrect" })
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ error: "Password not matched" })
        }
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        user.password = hashed;

        await user.save();
        res.status(201).json(user)
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
export const forgetPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the email is valid (you can add more validation)
        if (!email) {
            return res.status(400).json({ error: "Please enter a valid email" });
        }

        // Fetch the user by their email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: "Email does not exist" });
        }

        // Generate an OTP token and store it
        const token = crypto.randomBytes(12).toString("hex");
        const expires = Date.now() + 3600000;
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expires;
        await user.save();

        // Create an email and send the OTP token to the user
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.DEV_EMAIL,
                pass: process.env.DEV_PASS
            }
        });

        const mailOptions = {
            from: process.env.DEV_EMAIL,
            to: email,
            subject: 'Password Reset',
            text: `Your OTP is ${" "} ${token}`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                return res.status(400).json({ error: "Failed to send the email" });
            }
            return res.status(200).json({
                _id: user._id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                password: user.password,
                picture: user.picture,
                isAdmin: user.isAdmin,
                token: createToken(user._id)
            });
        });
    } catch (error) {
        res.status(400).json({ error: "Failed to send the email" });
    }
}

export const resetPassword = async (req, res) => {

    const { password, confirmPassword, resetPasswordToken } = req.body;

    try {
        if (!password || !confirmPassword || !resetPasswordToken) {
            return res.status(400).json("All fields are mandatory to be filled")
        }
        if (password !== confirmPassword) {
            return res.status(400).json("Password not matched")
        }
        if (!resetPasswordToken) {
            return res.status(400).json("Please enter the OTP")
        }
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (user.resetPasswordToken !== req.body.resetPasswordToken) {
            return res.status(400).json("OTP is not correct ")
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt)
        user.password = hash;

        user.resetPasswordExpires = undefined;
        user.resetPasswordToken = undefined;
        await user.save();
        res.status(201).json({
            _id: user._id,
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            password: user.password,
            picture: user.picture,
            isAdmin: user.isAdmin,
            token: createToken(user._id)
        })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
export const getUser = async (req, res) => {

    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" })
        }
        res.status(200).json(user)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}