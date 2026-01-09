import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

//REGISTER 
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword
    });

    return res.status(201).json({ message: "User Created Successfully" });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//LOGIN 
router.post("/login", async (req, res) => {   
  try {
    const { email, password } = req.body;
    console.log(email,password);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password); 
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ token, message: "Login Successful" });

  } catch (error) {
    return res.status(500).json({ error: error.message }); 
  }
});

export default router;
