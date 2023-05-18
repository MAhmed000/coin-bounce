class CommentDTO{
    constructor(comment){
        this._id=comment._id;
        this.content=comment.content;
        this.createdAt=comment.createdAt;
        this.authorName=comment.author.username;
        this.blogTitle=comment.blog.title;
    }
}

module.exports=CommentDTO;