const { postsController } = require("../controllers");
const { readToken } = require("../config/encryption");
const route = require("express").Router();

route.get("/get", postsController.getAllPosts);
route.get("/get/detail", postsController.detailPost);
route.get("/get/userPost", postsController.getUserPosts);
route.get("/get/likedPost", postsController.getLikedPosts);
route.get("/get/comments/:postId/:lastIdComment",postsController.getMoreComments)
route.get("/get/:id", postsController.getPosts);

route.post("/add", readToken, postsController.addPost);
route.patch("/edit", readToken, postsController.editPost);
route.delete("/delete", readToken, postsController.deletePost);
route.post("/comment", readToken, postsController.addComment);

route.post("/like", readToken, postsController.addLike);
route.delete("/unlike", readToken, postsController.removeLike);

module.exports = route;