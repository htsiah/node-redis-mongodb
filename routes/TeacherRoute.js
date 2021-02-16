const express = require('express');

const TeacherController = require('../Controllers/TeacherController');

const router = express.Router();

router.get('/', TeacherController.getTeacher);
router.get('/:id', TeacherController.getTeacherlById);
router.post('/', TeacherController.createTeacher);
router.patch('/:id', TeacherController.updateTeacherById);
router.delete('/:id', TeacherController.deleteTeacherById);

module.exports = router;