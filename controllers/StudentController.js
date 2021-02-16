const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const redis = require('redis')
const util = require('util');

const StudentModel = require('../models/StudentModel');

// Create and connect redis client to local instance.
const redisClient = redis.createClient();

// If you are connecting to other server, uncomment below.
// const redisURL = 'redis://127.0.0.1:6379'
// const client = redis.createClient(redisURL) 

// Print redis errors to the console
redisClient.on('error', (err) => {
  console.log("Error " + err);
});

// Promisify the client.get method using util.promisify.
redisClient.hget = util.promisify(redisClient.hget);

const getStudent = async (req, res, next) => {
    try {
      // Search query
      const query = StudentModel.find({}).sort('year');

      // If there is cache data in redis, return cache data.
      const cacheStudents = await redisClient.hget(
        StudentModel.collection.collectionName, 
        JSON.stringify(query.getQuery())
      )

      if (cacheStudents) {
        // Remember convert to javascript object
        console.log('Get from cache.')
        const students = JSON.parse(cacheStudents);
        return res.json(students.map((student) => student));
      }      

      // If not, find the data in mongodb, store the data to redis and return the data.
      console.log('Get from mongodb server.');
      const students = await query.exec();

      // Since redis can not store javascript object, JSON.stringify before storing.
      redisClient.hset(
        StudentModel.collection.collectionName, 
        JSON.stringify(query.getQuery()), 
        JSON.stringify(students.map((student) => student.toObject({ getters: false })))
      )
      
      // Set 1 day expire
      redisClient.expire(this.hashKey, 60 * 60 * 24);
      
      res.json(students.map((student) => student.toObject({ getters: false })));
    } catch {
      const error = new Error('Failed to get documents.');
      return next(error);
    }
};

const getStudentById = async (req, res, next) => {
    const id = req.params.id;

    try {
      // Search query
      const query = StudentModel.findById(id);

      // If there is cache data in redis, return cache data.
      const cacheStudent = await redisClient.hget(
        StudentModel.collection.collectionName, 
        JSON.stringify(query.getQuery())
      )

      if (cacheStudent) {
        // Remember convert to javascript object
        console.log('Get from cache.')
        return res.json(JSON.parse(cacheStudent)); 
      }      

      // If not, find the data in mongodb, store the data to redis and return the data.
      console.log('Get from mongodb server.');
      const student = await query.exec();
      
      // Since redis can not store javascript object, JSON.stringify before storing.
      redisClient.hset(
        StudentModel.collection.collectionName, 
        JSON.stringify(query.getQuery()), 
        JSON.stringify(student.toObject({ getters: false }))
      )

      // Set 1 day expire
      redisClient.expire(this.hashKey, 60 * 60 * 24);
      
      res.json(student.toObject({ getters: false }));
    } catch {
      const error = new Error('Failed to get document.');
      return next(error);
    }
};

const createStudent = async (req, res, next) => {
    const { year, standard } = req.body;

    const session = await StudentModel.startSession();
    session.startTransaction();

    const newStudent = new StudentModel({
      id: uuidv4(),
      year: year,
      standard: standard,
    })
  
    try {
      const opts = { session };
      await newStudent.save(opts);

      // commit the changes if everything was successful
      await session.commitTransaction();
      session.endSession();

      // Delete cache collection.
      redisClient.del(StudentModel.collection.collectionName)
    } catch (err) {
      // If an error occurred, abort the whole transaction and
      // undo any changes that might have happened
      await session.abortTransaction();
      session.endSession();

      const error = new Error(' Creating document failed.');
      return next(error);
    }
  
    res.status(201).json(newStudent);
};

const updateStudentById = async (req, res, next) => {
    const { year, standard } = req.body;
    const id = req.params.id;
    
    const session = await StudentModel.startSession();
    session.startTransaction();

    try {
      const opts = { session, new: true };
      const student = await StudentModel.findByIdAndUpdate(id, {
        year: year,
        standard: standard,
      }, opts);

      // commit the changes if everything was successful
      await session.commitTransaction();
      session.endSession();

      // Delete cache collection.
      redisClient.del(StudentModel.collection.collectionName)
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

const deleteStudentById = async (req, res, next) => {
    const id = req.params.id;
    
    const session = await StudentModel.startSession();
    session.startTransaction();

    try {
      const opts = { session };
      await StudentModel.findByIdAndDelete(id, opts);

      // commit the changes if everything was successful
      await session.commitTransaction();
      session.endSession();

      // Delete cache document.
      redisClient.del(StudentModel.collection.collectionName)
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

exports.getStudent = getStudent;
exports.getStudentlById = getStudentById;
exports.createStudent = createStudent;
exports.updateStudentById = updateStudentById;
exports.deleteStudentById = deleteStudentById;