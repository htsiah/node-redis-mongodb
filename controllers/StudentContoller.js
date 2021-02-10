const { v4: uuidv4 } = require('uuid');
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
redisClient.get = util.promisify(redisClient.get);

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

    try {
      // If there is cache data in redis, return cache data.
      // Key formula is [collection]:[documentid]
      const cacheStudent = await redisClient.get('student:' + id)

      if (cacheStudent) {
        console.log('Get from cache.')
        // Remember convert to javascript object
        return res.json(JSON.parse(cacheStudent)); 
      }      

      console.log('Get from mongodb server.')

      // If not, find the data in mongodb, store the data to redis and return the data.
      const student = await StudentModel.findById(id).sort([['year', 1]]);
      
      // Since redis can not store javascript object, JSON.stringify before storing.
      // Set expire in 5 second. 1 day is 60 * 60 * 24. Depends on requirement.
      redisClient.set('student:' + id, JSON.stringify(student.toObject({ getters: false })), 'EX', 5)
      
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

      // Check if there is cache data in redis.
      // Key formula is [collection]:[documentid]
      const cacheStudent = await redisClient.get('student:' + id)
      
      if (cacheStudent) {
        redisClient.set('student:' + id, JSON.stringify(student.toObject({ getters: false }), 'EX', 5))
      }
      
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

exports.getStudent = getStudent;
exports.getStudentlById = getStudentById;
exports.createStudent = createStudent;
exports.updateStudentById = updateStudentById;
exports.deleteStudentById = deleteStudentById;