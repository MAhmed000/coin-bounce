const express=require("express");
const authController = require("../controllers/authController");
const blogController=require("../controllers/blogController");
const auth = require("../middleware/auth");
const commentController = require("../controllers/commentController");

const router=express.Router();

//              USER
//  1 Register
    router.post("/register",authController.register);

//  2 Login
    router.post("/login",authController.login);

//  3 Logout
    router.post("/logout",auth,authController.logout)

//  4 Refresh
    router.get("/refresh",authController.refresh)


//                Blog
// create
    router.post("/blog",auth,blogController.create);

// read All
    router.get("/blog/all",auth,blogController.getall);
// update
    router.put("/blog",auth,blogController.update);
// delete
    router.delete("/blog/:id",blogController.delete)
// read by id
    router.get("/blog/:id",auth,blogController.getById);

//                  Comments

// create Comment
    router.post("/comment",commentController.create);

// Read Comment by Blog id

    router.get("/comment/:id",commentController.getByID);

module.exports=router;