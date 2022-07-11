const jwt = require("jsonwebtoken"); // yang akan membuat enkripsi keseluruhan data
const Crypto = require("crypto"); // library bawaan dari express untuk mengenkripsi password
const { dbConf, dbQuery } = require("../config/database");

module.exports = {
  hashPassword: (password) => {
    // bisa pakai createHmac / createHash untuk mengenerate kode enkripsi
    // di dalam () adalah algoritma dan key/kuncinya
    // .digest => diarahkan ke apa, misal hex berarti hexadesimal
    return Crypto.createHmac("sha256", "individual-project-purwadhika")
      .update(password)
      .digest("hex");
  },

  createToken: (payload, time = "24h") => {
    // payload berisi data apa saja yang mau diubah menjadi token
    //.sign berisi datanya dan key/kunci bisa dibedakan dengan yang hashPassword
    let token = jwt.sign(payload, "individual-project-purwadhika", {
      expiresIn: time,
    });

    return token;
  },
  // untuk check apakah token sudah ada sebelumnya atau tidak, terutama untuk verifikasi dan forgot password
  checkToken: async (req, res, next) => {
    try {
      let dataToken = await dbQuery(
        `select * from token where token="${req.token}" and type="${req.body.type}"`
      );
      if (dataToken.length) {
        console.log("Token exist");
        jwt.verify(
          req.token,"individual-project-purwadhika", (err, decode) => {
            if (err) {
              return res.status(401).send({
                success:false,
                message: "Token expired ❌",
              });
            }
            return res.status(200).send({
              success: true,
              message: "Token valid",
            });
          }
        );
      } else {
        return res.status(401).send({
          success: false,
          message: "Token invalid",
        });
      }
    } catch (error) {
      res.status(401).send({
        success: false,
        message: "Token invalid",
      });
      return next(error);
    }
  },
  readToken: (req, res, next) => {
    // untuk menerjemahkan data yang sudah dibuat oleh createToken
    // .verify berisi datanya, dan kuncinya apa disamakan dengan di createToken
    jwt.verify(req.token, "individual-project-purwadhika", (err, decode) => {
      if (err) {
        res.status(401).send({
          message: "User Not Authenticated ❌",
        });
      }
      // dataUser => property tambahan untuk disimpan ke dlam request
      req.dataUser = decode;
      //supaya bisa menjalankan ke middleware berikutnya
      next();
    });
  },
};
