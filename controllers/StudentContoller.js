const { v4: uuidv4 } = require('uuid');

const StudentModel = require('../models/StudentModel');

const getStudent = async (req, res, next) => {
    let students;
    try {
        students = await StudentModel.find({}).sort('year');
    } catch {
      const error = new Error('Failed to get documents.');
      return next(error);
    }
  
    res.json(students.map((student) => student.toObject({ getters: true })));
};

const getStudentById = async (req, res, next) => {
    const id = req.params.id;

    let student;
    try {
        student = await StudentModel.findById(id).sort([['year', 1]]);
    } catch {
      const error = new Error('Failed to get document.');
      return next(error);
    }
  
    res.json(student.toObject({ getters: true }));
};

const createStudent = (req, res, next) => {
    const { year, standard } = req.body;

    const newCustomer = new StudentModel({
      id: uuidv4(),
      year: year,
      standard: standard,
    });
  
    try {
      newCustomer.save();
    } catch (err) {
      const error = new Error(' Creating document failed.');
      return next(error);
    }
  
    res.status(201).json(newCustomer);
};

const updateStudentById = async (req, res, next) => {
    const { year, standard } = req.body;
    const id = req.params.id;
  
    let student;
    try {
        student = await StudentModel.findByIdAndUpdate(id, {
        year: year,
        standard: standard,
      });
    } catch {
      const error = new Error('Updating document failed.');
      return next(error);
    }
  
    res.status(200).json({ status: 'success' });
};

const deleteStudentById = async (req, res, next) => {
    const id = req.params.id;
    
    try {
      await StudentModel.findByIdAndDelete(id);
    } catch {
      const error = new Error('Updating document failed.');
      return next(error);
    }
  
    res.status(200).json({ status: 'success' });
};

exports.getStudent = getStudent;
exports.getStudentlById = getStudentById;
exports.createStudent = createStudent;
exports.updateStudentById = updateStudentById;
exports.deleteStudentById = deleteStudentById;