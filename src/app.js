import express from 'express'
import cookieParser from 'cookie-parser';
import cors from "cors"


const app = express();

// cors setting
app.use(cors({
    
    origin:process.env.CORS_ORIGIN,
    credentials:true
}
))

//handling json data
//It parses incoming requests with JSON payloads and exposes the resulting JSON object on req.body.
app.use(express.json({limit:"16kb"}));


//handling url 
app.use(express.urlencoded({extended:true,limit:"16kb"}));

app.use(express.static("public"))
app.use(cookieParser())     



//routes import
import userRouter from "./routes/user.routes.js"


//routes declaration


//jokhon user type korbe /api/v1/users tokhon access chole jabe userRouter er kache
app.use("/api/v1/users",userRouter)


//http://localhost:3000/api/v1/users/register ->[register userRouter e ase]


export {app};