const { dbQuery } = require("../config/database");

module.exports = {
  getUsers: async (req, res, next) => {
    try {
      let resultUsers = await dbQuery(
        "select username, first_name, last_name, email, profile_picture, bio, verified_status from users"
      )
      res.status(200).send(resultUsers)
    } catch (error) {
      return next(error)
    }
  },
  registerUser: async (req, res, next) => {
    try {

    } catch (error) {
      return next(error)
    }
  },
  login: async (req, res, next) => {
    try {

    } catch (error) {
      return next(error)
    }
  },
  keepLogin: async (req, res, next) => {
    try {

    } catch (error) {
      return next(error)
    }
  },
}