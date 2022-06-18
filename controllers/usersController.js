const { dbConf, dbQuery } = require("../config/database");
const { hashPassword, createToken } = require("../config/encryption");
const { uploader } = require("../config/uploader");
const fs = require("fs");

module.exports = {
  getUsers: async (req, res, next) => {
    try {
      let resultUsers = await dbQuery(
        "select id, username, first_name, last_name, email, profile_picture, bio, verified_status from users"
      );
      res.status(200).send(resultUsers);
    } catch (error) {
      return next(error);
    }
  },
  getDetailUser: async (req, res, next) => {
    try {
      let resultUser = await dbQuery(
        `select id, username, first_name, last_name, email, profile_picture, bio from users where id = ${req.query.id}`
      );
      res.status(200).send(resultUser);
    } catch (error) {
      return next(error);
    }
  },
  registerUser: async (req, res, next) => {
    try {
      // first_name, last_name, bio default value kosong
      // verified status default 1 => false, nanti setelah verifikasi dibuat 0 => true
      // profile picture diisikan dengan gambar default
      // console.log(hashPassword(req.body.password))
      const { email, username, password } = req.body;
      let registUser = await dbQuery(
        `insert into users (email, username, password, profile_picture) value (${dbConf.escape(
          email
        )},${dbConf.escape(username)},${dbConf.escape(
          hashPassword(password)
        )},${dbConf.escape("/imgUsers/IMGUSERS-default.webp")})`
      );
      // console.log(registUser.insertId);

      if (registUser.insertId) {
        let resultLogin = await dbQuery(
          `select * from users where id=${registUser.insertId};`
        );
        if (resultLogin.length) {
          return res.status(200).send(resultLogin[0]);
        } else {
          return res.status(404).send({
            success: false,
            message: "user not found",
          });
        }
      }
    } catch (error) {
      return next(error);
    }
  },
  userLogin: async (req, res, next) => {
    try {
      // loginBy menentukan apakah login berdasarkan email / username
      // loginByValue isi dari email/username yang dimasukkan
      const { loginBy, loginByValue, password } = req.body;
      let resultLogin = await dbQuery(
        `select id, username, first_name, last_name, email, profile_picture, bio, verified_status from users where ${loginBy}='${loginByValue}' and password='${hashPassword(
          password
        )}'`
      );
      console.log(resultLogin)
      // console.log(hashPassword(password));
      if (resultLogin.length) {
        let {
          id,
          username,
          first_name,
          last_name,
          email,
          profile_picture,
          bio,
          verified_status,
        } = resultLogin[0];
        let token = createToken({
          id,
          username,
          first_name,
          last_name,
          email,
          profile_picture,
          bio,
          verified_status,
        });

        return res.status(200).send({ ...resultLogin[0], token });
      } else {
        return res.status(404).send({
          success: false,
          message: "user not found",
        });
      }
    } catch (error) {
      return next(error);
    }
  },
  keepLogin: async (req, res, next) => {
    try {
      // request body mengirimkan token id user yang disimpan dari local storage
      console.log(req.dataUser);
      console.log(req.dataUser.id);
      if (req.dataUser.id) {
        let resultLogin = await dbQuery(
          `select id, username, first_name, last_name, email, profile_picture, bio, verified_status from users where id=${req.dataUser.id};`
        );
        if (resultLogin.length) {
          let {
            id,
            username,
            first_name,
            last_name,
            email,
            profile_picture,
            bio,
            verified_status,
          } = resultLogin[0];

          let token = createToken({
            id,
            username,
            first_name,
            last_name,
            email,
            profile_picture,
            bio,
            verified_status,
          });

          return res.status(200).send({ ...resultLogin[0], token });
        } else {
          return res.status(404).send({
            success: false,
            message: "user not found",
          });
        }
      }
    } catch (error) {
      return next(error);
    }
  },
  verifyUser: async (req, res, next) => {
    try {
    } catch (error) {
      return next(error);
    }
  },
  editUser: async (req, res, next) => {
    // untuk melakukan edit profile:
    // first_name, last_name, bio

    // pengiriman data FE hanya token => masuk ke readtoken => untuk mendapatkan id, tidak dari req.body
    // setelah itu create token ulang
    try {
      let userData = await dbQuery(
        `select * from users where id = ${req.body.id}`
      );

      let editScript = "";
      for (userProp in userData[0]) {
        for (dataProp in req.body) {
          if (userProp == dataProp) {
            editScript += `${userProp} = ${dbConf.escape(
              req.body[dataProp]
            )}, `;
          }
        }
      }
      editScript = editScript.substring(0, editScript.length - 2);
      let updateUser = await dbQuery(
        `update users set ${editScript} where id = ${req.body.id};`
      );
      return res.status(200).send({
        success: true,
        message: "user updated",
        updateUser,
      });
    } catch (error) {
      return next(error);
    }
  },
  editProfPict: async (req, res, next) => {
    // pengiriman data FE hanya token => masuk ke readtoken => untuk mendapatkan id, tidak dari req.body
    // setelah itu create token ulang
    try {
      const uploadFile = uploader("/imgUsers", "IMGUSERS").array("image", 1);
      // console.log(uploadFile);
      uploadFile(req, res, async (error) => {
        try {
          console.log(req.body.data);
          console.log("pengecekan file:", req.files);
          const { id } = JSON.parse(req.body.data);

          // remove from directory
          try {
            let currentPicture = await dbQuery(
              `select profile_picture from users where id = ${id}`
            );
            console.log(currentPicture[0].profile_picture)
            if (currentPicture[0].profile_picture != '/imgUsers/IMGUSERS-default.webp'){
              fs.unlinkSync(`./public/${currentPicture[0].profile_picture}`);
            }
          } catch (error) {
            return next(error);
          }

          let changePicture = await dbQuery(
            `update users set profile_picture = '/imgUsers/${req.files[0].filename}' where id = ${id};`
          );
          if (changePicture) {
            return res.status(200).send(changePicture);
          }
        } catch (error) {
          req.files.forEach((val) =>
            fs.unlinkSync(`./public/imgUsers/${val.filename}`)
          );
          return next(error);
        }
      });
    } catch (error) {
      return next(error);
    }
  },
  editPassword: async (req, res, next) => {
    // pengiriman data FE hanya token => masuk ke readtoken => untuk mendapatkan id, tidak dari req.body
    try {
      const { id, oldPassword, newPassword } = req.body;
      console.log(req.body)
      let password = await dbQuery(
        `select password from users where id = ${id}`
      );
      console.log(hashPassword(oldPassword))
      console.log(password[0].password)
      if (hashPassword(oldPassword) == password[0].password) {
        try {
          let update = await dbQuery(
            `update users set password = ${dbConf.escape(
              hashPassword(newPassword)
            )} where id = ${id}`
          );
          if (update) {
            return res.status(200).send({
              succes:true,
              message:"Password berhasil diubah"});
          }
        } catch (error) {
          return next(error);
        }
      } else {
        return res.status(400).send({
          succes:false,
          message:"Password lama tidak sesuai"});
      }
    } catch (error) {
      return next(error);
    }
  },
};
