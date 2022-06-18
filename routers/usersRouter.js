const { readToken } = require("../config/encryption");
const { usersController } = require("../controllers");
const route = require("express").Router();

route.get("/get", usersController.getUsers);
route.get("/get/detail", usersController.getDetailUser);
route.post("/login", usersController.userLogin);
route.get("/login/keep", readToken, usersController.keepLogin);
route.post("/register", usersController.registerUser);
route.patch("/edit", usersController.editUser);
route.patch("/edit/profile_picture", usersController.editProfPict);
route.patch("/edit/password", usersController.editPassword);

module.exports = route;
