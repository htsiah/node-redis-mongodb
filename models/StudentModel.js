const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const studentSchema = new Schema({
  year: { type: Number },
  standard: { type: Number },
});

const StudentModel = mongoose.model('student', studentSchema);

module.exports = StudentModel;