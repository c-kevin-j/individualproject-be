const { checkToken, readToken } = require("../config/encryption");
const { usersController } = require("../controllers");
const route = require("express").Router();

route.get("/get", usersController.getUsers);
route.get("/get/detail", usersController.getDetailUser);
route.post("/login", usersController.userLogin);
route.post("/keepLogin", readToken, usersController.keepLogin);
route.post("/register", usersController.registerUser);
route.patch("/verify", readToken, usersController.verifyUser);
route.get("/verify/send", readToken, usersController.sendVerification);

route.patch("/token/check", checkToken);
route.patch("/forgot", usersController.forgotPassword);
route.patch("/reset/password", readToken,usersController.resetPassword);

route.patch("/edit", readToken, usersController.editUser);
route.patch("/edit/profile_picture", readToken, usersController.editProfPict);
route.patch("/edit/password", readToken, usersController.editPassword);

module.exports = route;
