const bcrypt = require("bcryptjs");
const { generateUserToken, verifyUserToken } = require("../utils/generateToken");
const User = require("../models/userModel");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Try all user types
    const user =
      (await User.Student.findOne({ email }).select("+password")) ||
      (await User.Instructor.findOne({ email }).select("+password")) ||
      (await User.Admin.findOne({ email }).select("+password"));

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.active) return res.status(403).json({ message: "User is not active" });

    const token = generateUserToken(user.email, user.role, user._id);

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    };

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: `${user.role} login successful`,
      user: { id: user._id, role: user.role, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

const verifyLogin = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = verifyUserToken(token);
    if (!decoded) return res.status(401).json({ message: "Invalid or expired token" });

    res.status(200).json({ loggedIn: true, user: decoded });
  } catch (err) {
    res.status(500).json({ message: "Error verifying login", error: err.message });
  }
};

const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: "Error logging out", error: err.message });
  }
};

module.exports = { loginUser, verifyLogin, logout };
