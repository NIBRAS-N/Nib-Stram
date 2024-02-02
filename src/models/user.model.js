import mongoose,{Schema} from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


const userSchema = new Schema({
    
    username:{
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        
    },
    fullName:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
        
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,'passwrod must be given']
    },
    refreshToken:{
        type:String
    }

},{timestamps:true})


// pre is mongoose middleware . it is used to encrypt password[or other things] just beforse saving data 
// read documentation from: https://mongoosejs.com/docs/middleware.html


// Here we are hashing the password 
// hash only that time when password field is changed, update or other thing happened

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    // console.log("lololol",this.password)
    this.password = await bcrypt.hash(this.password,10);
})

//adding custom Schema name isPasswordCorrect

userSchema.methods.isPasswordCorrect  = async function(password){
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken= function(){
    //console.log("from schema gen acc");
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    
    )
}
userSchema.methods.generateRefreshToken= function(){
    //console.log("from schema gen ref ",process.env.REFRESH_TOKEN_SECRET);
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPAIRY
        }
    
    )
}

export const User = mongoose.model("User",userSchema);


// How to use this models?
// Use the custom method on a User instance

// const user = new User({ name: 'Alice', email: 'alice@example.com' });
// user.isPasswordCorrect('abc123'); 