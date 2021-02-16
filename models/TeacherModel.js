const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const teacherSchema = new Schema({
  year: { type: Number },
  standard: { type: Number },
});

module.exports = mongoose.model('teacher', teacherSchema);