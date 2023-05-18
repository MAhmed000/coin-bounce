class blogDTO{
    constructor(blog){
        this.id=blog._id;
        this.title=blog.title;
        this.author=blog.author;
        this.content=blog.content;
        this.photoPath=blog.photoPath;
    }
}

module.exports=blogDTO;