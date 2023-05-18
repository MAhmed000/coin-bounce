const Joi = require('joi');
const fs=require('fs');
const Blog=require("../models/blog");
const {BACKEND_SERVER_PATH}=require("../config/index");
const blogDTO = require('../dto/blog');
const blogDetailDTO=require("../dto/blogsDetails");
const Comment=require("../models/comment");

const mongoDbIdPattern=/^[0-9a-fA-F]{24}$/i;

const blogController={
    async create(req,res,next){
        // 1-> validate Request Body
            // Photo come from client side base64 encoded string -> decode -> store -> save photos path in data base database
        const blogSchema=Joi.object({
            title:Joi.string().required(),
            author:Joi.string().regex(mongoDbIdPattern).required(),
            content:Joi.string().required(),
            photo:Joi.string().required()
        });

        const error=blogSchema.validate(req.body).error;
        if(error){
            return next(error);
        }
        
        const {title,author,content,photo}=req.body;
        // 2-> handle photo
                    // Steps

        // read as Buffer
        const buffer=Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,''),'base64');
        
        // allot a random name
        const imagePath=`${Date.now()}-${author}.png`

        // save locally

        try {
            fs.writeFileSync(`storage/${imagePath}`,buffer);

        } catch (error) {
            return next(error);
        }

        // 3-> add to db
        let blog;
        try {
            const newBlog=new Blog({
                title,
                author,
                content,
                photoPath:`${BACKEND_SERVER_PATH}/storage/${imagePath}`
            });
            blog=await newBlog.save();
        } catch (error) {
            return next(error);
        }
        // 4-> return response
        const blogDto=new blogDTO(blog);
        res.status(201).json({blogDto});
    },
    async getall(req,res,next){
        let blogs;
        let blogsDto=[];
        try {
            blogs=await Blog.find({});
            for (let i= 0; i < blogs.length; i++) {
                const dto=new blogDTO(blogs[i]);
                blogsDto.push(dto);
            }
            return res.status(200).json({blogs:blogsDto});
        } catch (error) {
            return next(error);
        }
    },
    async update(req,res,next){
        // Validate Request Body
        const updateBlogSchema=Joi.object({
            title:Joi.string().required(),
            content:Joi.string().required(),
            author:Joi.string().regex(mongoDbIdPattern).required(),
            blogId:Joi.string().regex(mongoDbIdPattern).required(),
            photo:Joi.string()
        });
        const error=updateBlogSchema.validate(req.body).error;
        if(error){
            return next(error);
        }
        const {title,content,author,blogId,photo}=req.body;
        let blog;
        try {
            blog=await Blog.findOne({_id:blogId});
            if(!blog){
                const error={
                    status:401,
                    message:"Unauthorized"
                };
                return next(error);
            }
        } catch (error) {
            return next(error);
        }
        
        try {
            if(photo){
                let previousPhoto=blog.photoPath;
                previousPhoto=previousPhoto.split("/").at(-1);
                //delete previous photo from folder
                fs.unlinkSync(`storage/${previousPhoto}`)

                const buffer=Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,""),"base64");

                //Now CReate NewPhoto Name
                const imagePath=`${Date.now()}-${author}.png`;
                try {
                    fs.writeFileSync(`storage/${imagePath}`,buffer);
                    // Now Update Into DB
                    await Blog.updateOne({_id:blogId},{
                        title,
                        content,
                        photoPath:`${BACKEND_SERVER_PATH}/storage/${imagePath}`
                    });
                } catch (error) {
                    return next(error);
                }
            }else{
                await Blog.updateOne({_id:blogId},{
                    title:title,
                    content:content
                })
            }
        } catch (error) {
            return next(error);
        }
        res.status(200).json({message:"Blog Updated!"})
    },
    async delete(req,res,next){
        // Validate Blog Id
        const deleteBlogIDSchema=Joi.object({
            id:Joi.string().regex(mongoDbIdPattern).required()
        });
        const error=deleteBlogIDSchema.validate(req.params).error;
        if(error){
            return next(error);
        }
        const id=req.params.id;
        let blog;
        let delBlog;
        try {
            blog=await Blog.findById({_id:id});
            if(!blog){
                const error={
                    status:401,
                    message:"Unauthorized"
                }
                return next(error);
            }

            delBlog=await Blog.deleteOne({_id:id});
            //delete comments regarding this blog
            await Comment.deleteMany({blog:id});
        } catch (error) {
            return next(error);
        }
        return res.status(200).json({message:"Blog Delete Successfully..!"});
    },
    async getById(req,res,next){
        // validate id
        const blogIdSchema=Joi.object({
            id:Joi.string().regex(mongoDbIdPattern).required()
        });
        const error=blogIdSchema.validate(req.params).error;
        if(error){
            return next(error);
        }
        // response send
        let blog;
        const {id}=req.params;
        try {
            blog=await Blog.findById({_id:id}).populate("author");
            if(!blog){
                const error={
                    status:401,
                    message:"Unauthorized"
                }
                return next(error);
            }
        } catch (error) {
            return next(error);
        }
        const blogDto=new blogDetailDTO(blog);
        return res.status(200).json({blog:blogDto});
    }
}

module.exports=blogController;