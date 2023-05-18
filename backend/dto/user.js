class UserDTO{
    constructor(user){
        this.id=user._id;
        this.username=user.username;
        this.Email=user.email;
    }
}

module.exports=UserDTO;