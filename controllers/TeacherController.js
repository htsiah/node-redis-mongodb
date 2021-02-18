const { v4: uuidv4 } = require('uuid');

const TeacherModel = require('../models/TeacherModel');
const { clearCache } = require('../utils/useCacheUtil')

const getTeacher = async (req, res, next) => {
    try {
      // Search query
      const query = TeacherModel.find().cache().sort('year').limit(10000);    

      // Find the data in mongodb, store the data to redis and return the data.
      const teachers = await query.exec();

      res.json(teachers.map((teacher) => teacher.toObject({ getters: false })));
    } catch {
      const error = new Error('Failed to get documents.');
      return next(error);
    }
};

const getTeacherById = async (req, res, next) => {
    const id = req.params.id;

    try {
      // Search query
      const query = TeacherModel.findById(id).cache(); 

      // If not, find the data in mongodb, store the data to redis and return the data.
      const teacher = await query.exec();
            
      res.json(teacher.toObject({ getters: false }));
    } catch {
      const error = new Error('Failed to get document.');
      return next(error);
    }
};

const createTeacher = async (req, res, next) => {
    const { year, standard } = req.body;

    const session = await TeacherModel.startSession();
    session.startTransaction();

    const newTeacher = new TeacherModel({
      id: uuidv4(),
      year: year,
      standard: standard,
    })
  
    try {
      const opts = { session };
      const query = await newTeacher.save(opts);

      // commit the changes if everything was successful
      await session.commitTransaction();
      session.endSession();

      // Delete cache collection.
      clearCache(TeacherModel.collection.collectionName)
    } catch (err) {
      // If an error occurred, abort the whole transaction and
      // undo any changes that might have happened
      await session.abortTransaction();
      session.endSession();

      const error = new Error(' Creating document failed.');
      return next(error);
    }
  
    res.status(201).json(newTeacher);
};

const updateTeacherById = async (req, res, next) => {
    const { year, standard } = req.body;
    const id = req.params.id;
    
    const session = await TeacherModel.startSession();
    session.startTransaction();

    try {
      const opts = { session, new: true };
      const teacher = await TeacherModel.findByIdAndUpdate(id, {
        year: year,
        standard: standard,
      }, opts);

      // commit the changes if everything was successful
      await session.commitTransaction();
      session.endSession();

      // Delete cache collection.
      clearCache(TeacherModel.collection.collectionName)
    } catch {
      // If an error occurred, abort the whole transaction and
      // undo any changes that might have happened
      await session.abortTransaction();
      session.endSession();

      const error = new Error('Updating document failed.');
      return next(error);
    }
  
    res.status(200).json({ status: 'success' });
};

const deleteTeacherById = async (req, res, next) => {
    const id = req.params.id;
    
    const session = await TeacherModel.startSession();
    session.startTransaction();

    try {
      const opts = { session };
      await TeacherModel.findByIdAndDelete(id, opts);

      // commit the changes if everything was successful
      await session.commitTransaction();
      session.endSession();

      // Delete cache collection.
      clearCache(TeacherModel.collection.collectionName)
    } catch {
      // If an error occurred, abort the whole transaction and
      // undo any changes that might have happened
      await session.abortTransaction();
      session.endSession();

      const error = new Error('Deleting document failed.');
      return next(error);
    }
  
    res.status(200).json({ status: 'success' });
};

exports.getTeacher = getTeacher;
exports.getTeacherlById = getTeacherById;
exports.createTeacher = createTeacher;
exports.updateTeacherById = updateTeacherById;
exports.deleteTeacherById = deleteTeacherById;