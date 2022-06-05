const { usersController } = require("../controllers");
const route = require("express").Router();

route.get("/get", usersController.getUsers);
route.post("/register", usersController.registerUser);
route.post("/login", usersController.login);
route.post("/login/keep", usersController.keepLogin);

module.exports = route;
