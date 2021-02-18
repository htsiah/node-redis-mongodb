const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const teacherSchema = new Schema({
  year: { type: Number },
  standard: { type: Number },
});

const TeacherModel = mongoose.model('teacher', teacherSchema)

module.exports = TeacherModel;