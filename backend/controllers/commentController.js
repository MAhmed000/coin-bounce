const Joi = require("joi");
const comment = require("../models/comment");
const CommentDTO = require("../dto/comment");

const mongoIDPattern = /^[0-9a-fA-F]{24}$/i;

const commentController = {
  async create(req, res, next) {
    // validate
    const commentCreateSchema = Joi.object({
      content: Joi.string().required(),
      blog: Joi.string().regex(mongoIDPattern).required(),
      author: Joi.string().regex(mongoIDPattern).required(),
    });

    const { error } = commentCreateSchema.validate(req.body);
    const { content, blog, author } = req.body;

    if (error) {
      return next(error);
    }

    try {
      const newComment = new comment({
        content,
        author,
        blog,
      });
      await newComment.save();
    } catch (error) {
      return next(error);
    }
    return res.status(201).json({ message: "Comment Created" });
  },
  async getByID(req, res, next) {
    //validate
    const commentSchema = Joi.object({
      id: Joi.string().regex(mongoIDPattern).required(),
    });

    const { error } = commentSchema.validate(req.params);
    if (error) {
      return next(error);
    }
    const { id } = req.params;
    let comments;
    try {
      comments = await comment.find({ blog: id }).populate(['author','blog']);
      if (!comments) {
        const error = {
          status: 404,
          message: "No Comments Yet..!",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    let commentDto=[];
    for(let i=0;i<comments.length;i++){
        const obj = new CommentDTO(comments[i]);
        commentDto.push(obj);
    }
    return res.status(200).json({ data: commentDto });
  },
};

module.exports = commentController;
