const express = require('express')
const app = express();
const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true}, () => console.log('DB connected'))
mongoose.connection.on('error', err => {
  console.log(`DB connection error : ${err.message}`)
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
