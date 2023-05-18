class blogDetailDTO{
    constructor(blog){
        this.title=blog.title;
        this.content=blog.content;
        this.photoPath=blog.photoPath;
        this.authorName=blog.author.name;
        this.authoreUserName=blog.author.username;
        this.createdAt=blog.createdAt
    }
}

module.exports=blogDetailDTO;