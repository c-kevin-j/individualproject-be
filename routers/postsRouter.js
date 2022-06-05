const { postsController } = require("../controllers");
const route = require("express").Router();

route.get("/get", postsController.getPosts);

module.exports = route;