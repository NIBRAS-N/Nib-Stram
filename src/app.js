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
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import commentRouter from "./routes/comment.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import likeRouter from "./routes/like.routes.js"
import healthCheckRouter  from "./routes/healtcheck.routes.js"
//routes declaration


//jokhon user type korbe /api/v1/users tokhon access chole jabe userRouter er kache
app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/subscription",subscriptionRouter)
app.use("/api/v1/playlist",playlistRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/tweet",tweetRouter)
app.use("/api/v1/like",likeRouter)
app.use("/api/v1/healthCheck",healthCheckRouter)
//http://localhost:3000/api/v1/users/register ->[register userRouter e ase]


export {app};