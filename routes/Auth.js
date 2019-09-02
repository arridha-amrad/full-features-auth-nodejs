const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Auth } = require("../middleware/Index");
const { sendEmail } = require("../helpers/Index");
const dotenv = require("dotenv");
dotenv.config();

/*
desc = get logged in user
access = private
*/
router.get("/", Auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ err: "Server Error" });
  }
});

/*
desc = user login
access = public
*/
router.post(
  "/login",
  [
    check("email", "Please enter your valid email").isEmail(),
    check("password", "Password is required").exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ err: errors.array()[0].msg });
    }
    const { email, password } = req.body;
    try {
      // finding user with corresponding email inside database
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ err: "No user registered with that email" });
      }
      // check valid password and email
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ err: "invalid email and password" });
      }
      const payload = {
        user: {
          id: user.id
        }
      };

      // generate token
      jwt.sign(
        payload,
        process.env.SECRET,
        {
          expiresIn: 360000
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      res.status(500).json({ err: err.message });
    }
  }
);

/*
desc = register a user
access = public
*/
router.post(
  "/signup",
  [
    check("name", "Please enter your name")
      .not()
      .isEmpty(),
    check("email", "Please enter your valid email").isEmail(),
    check("password", "password is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    // if validator found errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ err: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      // find the email of inputed user
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ err: "User already exist" });
      }
      // create a new user
      user = new User({
        name,
        email,
        password
      });
      // salting user password
      const salt = await bcrypt.genSalt(15);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      res.status(200).json({ msg: "You can login now" });
    } catch (err) {
      res.status(400).json({ err: err.message });
    }
  }
);

router.put("/forgot-password", async (req, res) => {
  if (!req.body) return res.status(400).json({ message: "No request body" });
  if (!req.body.email)
    return res.status(400).json({ message: "No Email in request body" });

  console.log("forgot password finding user with that email");
  const { email } = req.body;
  console.log("signin req.body", email);
  // find the user based on email
  User.findOne({ email }, (err, user) => {
    // if err or no user
    if (err || !user)
      return res.status(401).json({
        error: "User with that email does not exist!"
      });

    // generate a token with user id and secret
    const token = jwt.sign(
      { _id: user._id, iss: "NODEAPI" },
      process.env.SECRET
    );

    // email data
    const emailData = {
      from: "noreply@node-react.com",
      to: email,
      subject: "Password Reset Instructions",
      text: `Please use the following link to reset your password: ${process.env.CLIENT_URL}/reset-password/${token}`,
      html: `<p>Please use the following link to reset your password:</p> <p>${process.env.CLIENT_URL}/reset-password/${token}</p>`
    };

    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.json({ message: err });
      } else {
        sendEmail(emailData);
        return res.status(200).json({
          message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
        });
      }
    });
  });
});

router.put(
  "/resetPassword",
  [
    check("newPassword", "Password is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ err: errors.array()[0].msg });
    }
    const { resetPasswordLink, newPassword } = req.body;
    try {
      let user = await User.findOne({ resetPasswordLink });

      // if no user
      if (!user)
        return res.status(400).json({
          err: "Invalid Link!"
        });

      const salt = await bcrypt.genSalt(15);
      user.password = await bcrypt.hash(newPassword, salt);
      user.resetPasswordLink = "";
      await user.save();
      res.status(400).json({ msg: "You can login with your new password" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
module.exports = router;
