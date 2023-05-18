const jwt=require("jsonwebtoken");
const {ACCESS_TOKEN_SECRET,REFRESH_TOKEN_SECRET} = require('../config/index');
const RefreshToken=require("../models/token");

class JWTService{
    // sign AccessToken
    static signAccessToken(payload,expiryTime){
        return jwt.sign(payload,ACCESS_TOKEN_SECRET,{expiresIn:expiryTime});
    }
    //sign RefreshToken
    static signRefreshToken(payload,expiryTime){
        return jwt.sign(payload,REFRESH_TOKEN_SECRET,{expiresIn:expiryTime});
    }
    //verify AccessToken
    static verifyAccessToken(token){
        return jwt.verify(token,ACCESS_TOKEN_SECRET);
    }
    //verify RefreshToken
    static verifyRefreshToken(token){
        return jwt.verify(token,REFRESH_TOKEN_SECRET);
    }
    //store Refresh Token
    static async storeRefreshToken(token,userId){
        try {
            const newToken=new RefreshToken({
                token:token,
                userId:userId
            });
            await newToken.save();
        } catch (error) {
            console.log("ERROR: ",error);
        }
    }
}

module.exports=JWTService;
