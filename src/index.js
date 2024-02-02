// require('dotenv').config({path:'./env'});

import dotenv from "dotenv"
import mongoose from 'mongoose'
import { DB_NAME } from './constants.js'
import express from 'express';
import connectDB from './db/index.js';
import { app } from "./app.js";

// const app = express();

dotenv.config({
    path:'./.env'
})


connectDB()
.then(()=>{

    app.on("error",(error)=>{
            console.log("error in src || index.js || conndectDB || app.on",error);
    })

    app.listen(process.env.PORT || 3000, ()=>{
        console.log(`server is running at ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.error("failed database connection at src || index.js", error)
});










// const app = express();
/*
;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        app.on("error",(error)=>{
            console.log("Error||app.on || IIFEE ", error)
            throw error;
        })

        app.listen(process.env.PORT , ()=>{
            console.log(`APP is listening on ${process.env.PORT}` );
        })

    } catch (error) {
        consosle.log("root || index.js || IIFEE ", error);
        throw error;
    }
})()
*/