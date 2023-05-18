const Joi = require("joi");
const User=require("../models/user");
const bcrypt=require("bcryptjs");
const UserDTO=require("../dto/user");
const JWTService=require("../services/JWTService");
const RefreshToken=require("../models/token");

const passwordPattern=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/

const authController={
    async register(req,res,next){
        // Validation user input
        const registerSchema=Joi.object({
            name:Joi.string().max(30).required(),
            username:Joi.string().min(5).max(30).required(),
            email:Joi.string().email().required(),
            password:Joi.string().pattern(passwordPattern).required(),
            confirmPassword:Joi.ref("password")
        });

        const error=registerSchema.validate(req.body).error;
        // if error in validation than return error via middleware
        if(error){
            return next(error);
        }

        // if email or username is already register -> return error
        const {name,username,email,password}=req.body;
        
        try {
            const usernameInUse=await User.exists({username});
            const emailInUse=await User.exists({email});
            if(usernameInUse){
                const error={
                    status:409,
                    message:"Username already registerd use another username"
                }
                return next(error);
            }

            if(emailInUse){
                const error={
                    status:409,
                    message:"Email already registerd use another email"
                }
                return next(error);
            }
        } catch (error) {
            return next(error);
        }

        // Password Hash
        const hashedPassword=await bcrypt.hash(password,10);

        // Store Data Into the Database
        let accessToken;
        let refreshToken;
        let user;
        try {
            const userToRegister=new User({
                name,
                username,
                email,
                password:hashedPassword
            });
    
            user=await userToRegister.save();

            // token Generation
            accessToken=JWTService.signAccessToken({_id:user._id},"30m");
            
            refreshToken=JWTService.signRefreshToken({_id:user._id},"60m");


        } catch (error) {
            return next(error);
        }
        // Send Token In Cookies
        res.cookie("accessToken",accessToken,{
            maxAge: 1000 * 60 * 60 *24,
            httpOnly:true
        });

        res.cookie("refreshToken",refreshToken,{
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly:true
        });
        // Store Refresh TOken in Db
        JWTService.storeRefreshToken(refreshToken,user._id);

        //return response
        const userDto=new UserDTO(user);
        res.status(201).json({userDto,auth:true});
    },
    async login(req,res,next){
        // validation username and password
        const loginSchema=Joi.object({
            username:Joi.string().min(5).max(30).required(),
            password:Joi.string().pattern(passwordPattern).required()
        });
        const {error}=loginSchema.validate(req.body);
        // if error in validation than throw error via middleware
        if(error){
            return next(error);
        }
        //match username and password
        const {username,password}=req.body;
        let user;
        try {
            user=await User.findOne({username});
            if(!user){
                const error={
                    status:401,
                    message:"Invalid Username..!"
                }
                return next(error);
            }
        } catch (error) {
            return next(error);
        }
        // Match Password
        try {
            const passworMatch=await bcrypt.compare(password,user.password);
            if(!passworMatch){
                const error={
                    status:401,
                    message:"Invalid Password..!"
                }
                return next(error);
            }
        } catch (error) {
            return next(error);
        }
        // return response
        const accessToken=JWTService.signAccessToken({_id:user._id},"30m");
        const refreshToken=JWTService.signRefreshToken({_id:user._id},"60m");

        // send token via cookie
        res.cookie("accessToken",accessToken,{
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly:true
        });
        res.cookie("refreshToken",refreshToken,{
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly:true
        });
        // update refresh Token in db
        try {
            await RefreshToken.updateOne(
                {_id:user._id},
                {token:refreshToken},
                {upsert:true});
        } catch (error) {
            return next(error);
        }
        const userDto=new UserDTO(user);
        return res.status(200).json({userDto,auth:true})
    },
    async logout(req,res,next){
        // 1-> Delete Refresh Token From DB
        const {refreshtoken}=req.cookies;
        try {
            await RefreshToken.deleteOne({token:refreshtoken});
        } catch (error) {
            return next(error);
        }
        // Clear All Access And Refresh Cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        // 2-> send Response
        return res.status(200).json({user:null,auth:false});
    },
    async refresh(req,res,next){
        // get Refresh Token From Cookies
        const originalRefreshToken=req.cookies.refreshtoken;
        // Verify Refresh Token
        let _id;
        try {
            _id=JWTService.verifyRefreshToken(originalRefreshToken)._id;
            
        } catch (e) {
            const error={
                status:401,
                message:"Unauthorized"
            }
         return next(error);   
        }
        try {
            const match=await RefreshToken.findOne({userId:_id,token:originalRefreshToken});
            if(!match){
                const error={
                    status:401,
                    message:"Unauthorized"
                }
            }
        } catch (error) {  
            return next(error);
        }
        // generate New Token
        const accesstoken=JWTService.signAccessToken({_id},"30m");
        const refreshtoken=JWTService.signRefreshToken({_id},"60m");
        // update db and generate response
        try {
            await RefreshToken.updateOne({_id},{token:refreshtoken});
            res.cookie("accesstoken",accesstoken,{
               maxAge: 1000 * 60 * 60 * 24 ,
               httpOnly:true
            });
            res.cookie("refreshtoken",refreshtoken,{
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly:true
            });
        } catch (error) {
            return next(error);
        }
        const user=await User.findOne({_id});
        const userDto=new UserDTO(user);
        return res.json({user:userDto,auth:true});
    }
}

module.exports=authController;