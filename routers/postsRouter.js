const { postsController } = require("../controllers");
const route = require("express").Router();

route.get("/get", postsController.getPosts);
route.get("/get/detail", postsController.detailPost);
route.get("/get/userPost", postsController.getUserPosts);
route.get("/get/likedPost", postsController.getLikedPosts);
route.post("/add", postsController.addPost);
route.patch("/edit", postsController.editPost);
route.delete("/delete", postsController.deletePost);
route.post("/comment", postsController.addComment);
route.post("/like", postsController.addLike);
route.delete("/unlike", postsController.removeLike);

module.exports = route;