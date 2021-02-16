const express = require('express');

const StudentController = require('../Controllers/StudentController');

const router = express.Router();

router.get('/', StudentController.getStudent);
router.get('/:id', StudentController.getStudentlById);
router.post('/', StudentController.createStudent);
router.patch('/:id', StudentController.updateStudentById);
router.delete('/:id', StudentController.deleteStudentById);

module.exports = router;