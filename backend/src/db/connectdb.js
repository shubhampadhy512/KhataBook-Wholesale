const mongoose = require("mongoose");
const DB_NAME = require("../constant.js");

const connectMongoose = async()=>{
    try{
        const conn = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`MongoDb connntected: ${conn}`);
    }catch(err){
        console.log("Error connecting to MongoDB;",err);
        process.exit(1);
    }
};

module.exports = connectMongoose;

