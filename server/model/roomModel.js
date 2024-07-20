// models/Room.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Room schema
const roomSchema = new Schema({
  status: {
    type: String,
  }
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
