const jwt = require('jsonwebtoken')

exports.Auth = (req, res, next) => {
  // get token from header
  const token = req.header('login-token')

  // check if valid token
  if(!token) {
    return res.status(400).json({ msg: 'Invalid token, authorization is denied'})
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded.user
    next()
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}