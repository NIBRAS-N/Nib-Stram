import mongoose from "mongoose";
import express from 'express'
import { DB_NAME } from "../constants.js";


const  connectDB = async () => {
    try {   
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connectd || DB Host ${connectionInstance.connection.host} `)
    } catch (error) {
        console.log("mongodb connection error ||src || db || index.js " , error);
        throw error;
    }
}


export default connectDB;