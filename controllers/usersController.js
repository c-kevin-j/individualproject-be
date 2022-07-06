const { dbConf, dbQuery } = require("../config/database");
const { hashPassword, createToken } = require("../config/encryption");
const { uploader } = require("../config/uploader");
const fs = require("fs");
const { transporter } = require("../config/nodemailer");
const crypto = require("crypto");

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

      let currentUsers = await dbQuery(
        `select email as userEmail, username from users`
      );
      let emailCheck = false;
      let usernameCheck = false;

      for (let i = 0; i < currentUsers.length; i++) {
        if (currentUsers[i].userEmail == email) {
          emailCheck = true;
        }
        if (currentUsers[i].username == username) {
          usernameCheck = true;
        }
      }
      // emailCheck = currentUsers.map((val) => val.email).includes(email);
      // usernameCheck = currentUsers
      //   .map((val) => val.username)
      //   .includes(username);

      if (emailCheck) {
        res
          .status(200)
          .send({ success: false, message: "Email is already used" });
      } else if (usernameCheck) {
        res
          .status(200)
          .send({ success: false, message: "Username is already used" });
      } else {
        let registUser = await dbQuery(
          `insert into users (email, username, password, profile_picture) value (${dbConf.escape(
            email
          )},${dbConf.escape(username)},${dbConf.escape(
            hashPassword(password)
          )},${dbConf.escape("/imgUsers/IMGUSERS-default.webp")})`
        );

        if (registUser.insertId) {
          let resultLogin = await dbQuery(
            `select id, username, first_name, last_name, email, profile_picture, bio, verified_status from users where id=${registUser.insertId};`
          );

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

          // generate random string to generate token
          let randomString = crypto.randomBytes(10).toString("hex");

          let token = createToken(
            {
              id,
              username,
              first_name,
              last_name,
              email,
              profile_picture,
              bio,
              verified_status,
              randomString,
            },
            "1h"
          );

          // insert token to database

          let insertToken = await dbQuery(
            `insert into token (user_id, type, token) value (${dbConf.escape(
              registUser.insertId
            )}, "verification", ${dbConf.escape(token)})`
          );

          let mailContent = fs.readFileSync(
            "./email/email_verification.html",
            "utf8",
            function (err, data) {
              if (err) throw err;
              console.log(data);
            }
          );
          mailContent = mailContent.replace("#name", username);
          mailContent = mailContent.replace(
            "#link",
            `${process.env.FE_URL}/auth/verify/${token}`
          );
          // Mengirimkan email
          await transporter.sendMail({
            from: "Admin",
            to: email,
            subject: "Account Verification Email",
            html: `${mailContent}`,
          });

          let tokenLogin = createToken(
            {
              id,
              username,
              first_name,
              last_name,
              email,
              profile_picture,
              bio,
              verified_status,
            },
            "1h"
          );

          if (resultLogin.length) {
            return res
              .status(200)
              .send({ success: true, user: { ...resultLogin[0], tokenLogin } });
          } else {
            return res.status(404).send({
              success: false,
              message: "user not found",
            });
          }
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

        return res
          .status(200)
          .send({ success: true, user: { ...resultLogin[0], token } });
      } else {
        return res.status(200).send({
          success: false,
          message: `Please input a correct username/email or password.`,
        });
      }
    } catch (error) {
      return next(error);
    }
  },
  keepLogin: async (req, res, next) => {
    // console.log("keeplogin",req)
    try {
      // request body mengirimkan token id user yang disimpan dari local storage

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
  // to change user verified status
  verifyUser: async (req, res, next) => {
    try {
      if (req.dataUser.id) {
        let verify = await dbQuery(
          `update users set verified_status = 0 where id = ${req.dataUser.id};`
        );

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
          // mengenerate token dari data yang diinginkan
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

          res.status(200).send({ ...resultLogin[0], token, success: true });
        }
      }
    } catch (error) {
      return next(error);
    }
  },
  // resend verification
  sendVerification: async (req, res, next) => {
    try {
      // console.log("resend verification req.dataUser", req.dataUser);
      if (req.dataUser.id) {
        let userData = await dbQuery(
          `select id,username,first_name,last_name,email,profile_picture,bio,verified_status FROM users WHERE id=${req.dataUser.id} ;`
        );

        if (userData.length) {
          // generate token untuk dikirim melalui email
          let {
            id,
            username,
            first_name,
            last_name,
            email,
            profile_picture,
            bio,
            verified_status,
          } = userData[0];
          // token bisa disesuaikan supaya masa tenggang expired dipersingkat, misal 15 menit- 1 jam
          // token to verify user

          // generate random string to generate token
          let randomString = crypto.randomBytes(10).toString("hex");

          let token = createToken(
            {
              id,
              username,
              first_name,
              last_name,
              email,
              profile_picture,
              bio,
              verified_status,
              randomString,
            },
            "1h"
          );

          // // check jika sudah ada token dari user di database token
          // let tokenData = await dbQuery (`select * from token where user_id=${dbConf.escape(id)} and type="verification"`)

          // // jika belum ada, insert token to database
          // let insertToken = await dbQuery (`insert into token (user_id, type, token) value (${dbConf.escape(registUser.insertId)}, "verification", (${dbConf.escape(token)})`)

          // update token pada database
          let updateToken = await dbQuery(
            `update token set token=${dbConf.escape(
              token
            )} where user_id=${dbConf.escape(id)} and type="verification"`
          );

          let mailContent = fs.readFileSync(
            "./email/email_verification.html",
            "utf8",
            function (err, data) {
              if (err) throw err;
              console.log(data);
            }
          );
          mailContent = mailContent.replace("#name", username);
          mailContent = mailContent.replace(
            "#link",
            `${process.env.FE_URL}/auth/verify/${token}`
          );
          // Mengirimkan email
          await transporter.sendMail({
            from: "Admin",
            to: email,
            subject: "Account Verification Email",
            html: `${mailContent}`,
          });
          // // Mengirimkan email
          // await transporter.sendMail({
          //   from: "Admin",
          //   to: email,
          //   subject: "Account Verification Email",
          //   html: `<div>
          //   <h3>Click this link to verify your account:</h3>
          //   <a href="${process.env.FE_URL}/auth/verify/${token}">Verify Account</a>
          //   <h5>This link is only valid for 1 hour</h5>
          // </div>`,
          // });
          res
            .status(200)
            .send({ success: true, message: "Email Verification Sent" });
        }
      }
    } catch (error) {
      return next(error);
    }
  },
  forgotPassword: async (req, res, next) => {
    try {
      let userData = await dbQuery(`select id,
      username, first_name, last_name,
      email,profile_picture,bio,verified_status FROM users WHERE email='${req.body.email}' ;`);
      if (userData.length) {
        let {
          id,
          username,
          first_name,
          last_name,
          email,
          profile_picture,
          bio,
          verified_status,
        } = userData[0];

        let randomString = crypto.randomBytes(10).toString("hex");
        let token = createToken(
          {
            id,
            username,
            first_name,
            last_name,
            email,
            profile_picture,
            bio,
            verified_status,
            randomString,
          },
          "1h"
        );

        let dataToken = await dbQuery(
          `select * from token where user_id=${dbConf.escape(
            id
          )} and type="forgot-password"`
        );

        if (dataToken.length) {
          // update token pada database
          let updateToken = await dbQuery(
            `update token set token=${dbConf.escape(
              token
            )} where user_id=${dbConf.escape(id)} and type="forgot-password"`
          );
        } else {
          // insert token pada database
          let insertToken = await dbQuery(
            `insert into token (user_id, type, token) value (${dbConf.escape(
              id
            )}, "forgot-password", ${dbConf.escape(token)})`
          );
        }


        let mailContent = fs.readFileSync(
          "./email/email_verification.html",
          "utf8",
          function (err, data) {
            if (err) throw err;
            console.log(data);
          }
        );
        mailContent = mailContent.replace("#name", username);
        mailContent = mailContent.replace(
          "#link",
          `${process.env.FE_URL}/auth/verify/${token}`
        );
        // Mengirimkan email
        await transporter.sendMail({
          from: "Admin",
          to: email,
          subject: "Forgot Password Email",
          html: `${mailContent}`,
        });
        // await transporter.sendMail({
        //   from: "Admin",
        //   to: email,
        //   subject: "Forgot Password Email",
        //   html: `<div>
        //     <h3>You have requested to reset your password</h3> 
        //     <h5>Click this link to reset your password</h5>
        //     <a href="${process.env.FE_URL}/auth/reset-password/${token}">Reset Password</a>
        //     <h5>If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.</h5>
        //     <h5>This link is only valid for 1 hour</h5>
        //   </div>`,
        // });

        res.status(200).send({ success: true, message: "Email sent" });
      } else {
        res.status(200).send({
          success: false,
          message: "Email not Found",
        });
      }
    } catch (error) {
      next(error);
    }
  },
  resetPassword: async (req, res, next) => {
    try {
      if (req.dataUser.id) {
        let resetPassword = await dbQuery(
          `update users set password = '${hashPassword(
            req.body.pass
          )}' where id =${req.dataUser.id}`
        );
        if (resetPassword) {
          res
            .status(200)
            .send({ success: true, message: "Password successfully reset" });
        }
      } else {
        res.status(400).send({ success: false });
      }
    } catch (error) {
      return next(error);
    }
  },
  editUser: async (req, res, next) => {
    // untuk melakukan edit profile:
    // first_name, last_name, bio

    // pengiriman data FE hanya token => masuk ke readtoken => untuk mendapatkan id, tidak dari req.body
    // setelah itu create token ulang
    if (req.dataUser.id) {
      try {
        // to check if new username is already registered
        let usernameCheck = false;

        if (req.body.oldUsername != req.body.username) {
          let currentUsers = await dbQuery(`select username from users`);
          for (let i = 0; i < currentUsers.length; i++) {
            if (currentUsers[i].username == req.body.username) {
              usernameCheck = true;
            }
          }
        }

        if (!usernameCheck) {
          try {
            let userData = await dbQuery(
              `select * from users where id = ${req.dataUser.id}`
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
              `update users set ${editScript} where id = ${req.dataUser.id};`
            );
            let newUserData = await dbQuery(
              `select id, username, first_name, last_name, email, profile_picture, bio, verified_status from users where id = ${req.dataUser.id}`
            );
            let {
              id,
              username,
              first_name,
              last_name,
              email,
              profile_picture,
              bio,
              verified_status,
            } = newUserData[0];
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
            return res.status(200).send({
              success: true,
              message: "user updated",
              updateUser,
              token,
            });
          } catch (error) {
            console.log(error);
          }
        } else {
          return res.status(200).send({
            success: false,
            message: "username is already used",
          });
        }
      } catch (error) {
        return next(error);
      }
    }
  },
  editProfPict: async (req, res, next) => {
    // pengiriman data FE hanya token => masuk ke readtoken => untuk mendapatkan id, tidak dari req.body
    // setelah itu create token ulang
    if (req.dataUser.id) {
      try {
        const uploadFile = uploader("/imgUsers", "IMGUSERS").array("image", 1);
        uploadFile(req, res, async (error) => {
          try {
            const { id } = JSON.parse(req.body.data);

            // remove from directory
            try {
              let currentPicture = await dbQuery(
                `select profile_picture from users where id = ${req.dataUser.id}`
              );
              if (
                currentPicture[0].profile_picture !=
                "/imgUsers/IMGUSERS-default.webp"
              ) {
                fs.unlinkSync(`./public/${currentPicture[0].profile_picture}`);
              }
            } catch (error) {
              return next(error);
            }

            let changePicture = await dbQuery(
              `update users set profile_picture = '/imgUsers/${req.files[0].filename}' where id = ${req.dataUser.id};`
            );
            if (changePicture) {
              let newUserData = await dbQuery(
                `select id, username, first_name, last_name, email, profile_picture, bio, verified_status from users where id = ${req.dataUser.id}`
              );
              let {
                id,
                username,
                first_name,
                last_name,
                email,
                profile_picture,
                bio,
                verified_status,
              } = newUserData[0];
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
              return res.status(200).send({ changePicture, token });
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
    }
  },
  editPassword: async (req, res, next) => {
    // pengiriman data FE hanya token => masuk ke readtoken => untuk mendapatkan id, tidak dari req.body
    if (req.dataUser.id) {
      try {
        const { oldPassword, newPassword } = req.body;
        let password = await dbQuery(
          `select password from users where id = ${req.dataUser.id}`
        );
        if (hashPassword(oldPassword) == password[0].password) {
          try {
            let update = await dbQuery(
              `update users set password = ${dbConf.escape(
                hashPassword(newPassword)
              )} where id = ${req.dataUser.id}`
            );
            if (update) {
              return res.status(200).send({
                success: true,
                message: "Password successfully changed",
              });
            }
          } catch (error) {
            return next(error);
          }
        } else {
          return res.status(200).send({
            succes: false,
            message: "Your old password is not matched",
          });
        }
      } catch (error) {
        return next(error);
      }
    }
  },
};
