const mongoose = require('mongoose');
const redis = require('redis')
const util = require('util');

// Create and connect redis client to local instance.
const redisClient = redis.createClient();

// If you are connecting to other server, uncomment below.
// const redisURL = 'redis://127.0.0.1:6379'
// const client = redis.createClient(redisURL) 

// Promisify the client.get method using util.promisify.
redisClient.hget = util.promisify(redisClient.hget);

// Original mongoose's exec function
const exec = mongoose.Query.prototype.exec;

// Add new cache() method into mongoose.
mongoose.Query.prototype.cache = function(options = {}){
    this.useCache = true;

    // Default key is collection name, but user can define key in the options by .cache({key: "KEY"})
    this.key = JSON.stringify(options.key || this.mongooseCollection.name);

    // Must return to enable chainable
    // Example: .cache().limit()
    // If not return, only can do .cache()
    return this
}

// Overwrite mongoose's exec function
mongoose.Query.prototype.exec = async function() {

    /**
    console.log('START DEBUG');
    console.log(this.getQuery());
    console.log(this.mongooseCollection.name);
    console.log('END DEBUG');
    */
   
    // Run as normall if the cache is false.
    if(!this.useCache){
        console.log('Get from mongodb server.');
        return exec.apply(this, arguments)
    }

    // Generate find query
    const findQuery = Object.assign( {}, this.getQuery(), this.getOptions());

    // If there is cache data in redis, return cache data.
    const cacheValue = await redisClient.hget(
        this.key, 
        JSON.stringify(findQuery)    
    )

    if (cacheValue) {
        // Remember convert to javascript object
        console.log('Get from cache.')
        const doc = JSON.parse(cacheValue);

        // Check is single or multiple document
        // new this.model is to return mongoose document
        return Array.isArray(doc)
            ? doc.map(d => new this.model(d))
            : new this.model(doc)
    }      

    // If not, run the original mongoose's exec and get the result, store the data to redis and return the data.
    console.log('Get from mongodb server.');
    const result = await exec.apply(this, arguments)

    redisClient.hset(
        this.key, 
        JSON.stringify(findQuery),
        JSON.stringify(result)
    )

    // Set 1 day expire
    redisClient.expire(this.key, 60 * 60 * 24);

    // Return the result
    return result
}

const clearCache = (key) => {
    redisClient.del(JSON.stringify(key));
}

exports.clearCache = clearCache;