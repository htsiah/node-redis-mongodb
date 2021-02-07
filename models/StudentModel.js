const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const studentSchema = new Schema({
  year: { type: Number },
  standard: { type: Number },
});

module.exports = mongoose.model('student', studentSchema);