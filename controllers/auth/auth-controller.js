const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

//register
const registerUser = async (req, res) => {
  const { userName, email, password, phoneNumber } = req.body;

  try {
    // Log incoming data for debugging
    console.log("Registration attempt:", { userName, email, phoneNumber, hasPassword: !!password });

    // Validate required fields
    if (!userName || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Either email or phone number is required",
      });
    }

    // Check if user exists by email or phone
    let checkUser = null;
    if (email) {
      checkUser = await User.findOne({ email });
      if (checkUser)
        return res.json({
          success: false,
          message: "User Already exists with the same email! Please try again",
        });
    }

    if (phoneNumber) {
      checkUser = await User.findOne({ phoneNumber });
      if (checkUser)
        return res.json({
          success: false,
          message: "User Already exists with the same phone number! Please try again",
        });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      userName,
      email: email || null,
      phoneNumber: phoneNumber || null,
      password: hashPassword,
    });

    await newUser.save();
    res.status(200).json({
      success: true,
      message: "Registration successful",
    });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred: " + e.message,
    });
  }
};

//login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser)
      return res.json({
        success: false,
        message: "User doesn't exists! Please register first",
      });

    const checkPasswordMatch = await bcrypt.compare(
      password,
      checkUser.password
    );
    if (!checkPasswordMatch)
      return res.json({
        success: false,
        message: "Incorrect password! Please try again",
      });

    const token = jwt.sign(
      {
        id: checkUser._id,
        role: checkUser.role,
        email: checkUser.email,
        userName: checkUser.userName,
      },
      "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    res.cookie("token", token, { httpOnly: true, secure: false }).json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser._id,
        userName: checkUser.userName,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

//login with phone
const loginWithPhone = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const checkUser = await User.findOne({ phoneNumber });
    if (!checkUser)
      return res.json({
        success: false,
        message: "User doesn't exist! Please register first or check your phone number",
      });

    // For phone login, password is the phone number itself
    const checkPasswordMatch = await bcrypt.compare(
      phoneNumber,
      checkUser.password
    );
    if (!checkPasswordMatch)
      return res.json({
        success: false,
        message: "Account found but password doesn't match phone number. Please contact support.",
      });

    const token = jwt.sign(
      {
        id: checkUser._id,
        role: checkUser.role,
        email: checkUser.email,
        phoneNumber: checkUser.phoneNumber,
        userName: checkUser.userName,
      },
      "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    res.cookie("token", token, { httpOnly: true, secure: false }).json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: checkUser.email,
        phoneNumber: checkUser.phoneNumber,
        role: checkUser.role,
        id: checkUser._id,
        userName: checkUser.userName,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

//logout

const logoutUser = (req, res) => {
  res.clearCookie("token").json({
    success: true,
    message: "Logged out successfully!",
  });
};

//auth middleware
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({
      success: false,
      message: "Unauthorised user!",
    });

  try {
    const decoded = jwt.verify(token, "CLIENT_SECRET_KEY");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorised user!",
    });
  }
};

module.exports = { registerUser, loginUser, loginWithPhone, logoutUser, authMiddleware };
