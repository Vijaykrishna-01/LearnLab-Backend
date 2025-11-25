const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { generateAccessToken, generateRefreshToken, verifyToken } = require("../utils/generateToken");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user =
      (await User.Student.findOne({ email }).select("+password")) ||
      (await User.Instructor.findOne({ email }).select("+password")) ||
      (await User.Admin.findOne({ email }).select("+password"));

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.active)
      return res.status(403).json({ message: "User is not active" });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 min
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: `${user.role} login successful`,
      user: { id: user._id, role: user.role, email: user.email , name: user.name},
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error logging in",
      error: err.message,
    });
  }
};

const verifyLogin = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ loggedIn: false });

    const decoded = verifyToken(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ loggedIn: false });

    return res.status(200).json({
      loggedIn: true,
      user: decoded,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error verifying login",
      error: err.message,
    });
  }
};

const logout = (req, res) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error logging out",
      error: err.message,
    });
  }
}

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    const decoded = verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (!decoded) return res.status(401).json({ message: "Invalid refresh token" });

    // Find user by id (from decoded)
    const user = await User[decoded.role.charAt(0).toUpperCase() + decoded.role.slice(1)].findById(decoded.id).select("+password"); // Or a unified User model
    if (!user || !user.active) return res.status(403).json({ message: "User inactive" });

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user); // Rotate refresh token for security

    // Set new cookies (full options copied from login)
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 min
    });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({ success: true }); // Cookie-only: no need to return accessToken
  } catch (err) {
    return res.status(500).json({ message: "Refresh failed", error: err.message });
  }
};

module.exports = { loginUser, verifyLogin, logout , refreshToken };