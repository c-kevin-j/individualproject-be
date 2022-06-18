const jwt = require("jsonwebtoken"); // yang akan membuat enkripsi keseluruhan data
const Crypto = require("crypto"); // library bawaan dari express untuk mengenkripsi password

module.exports = {
  hashPassword: (password) => {
    // bisa pakai createHmac / createHash untuk mengenerate kode enkripsi
    // di dalam () adalah algoritma dan key/kuncinya
    // .digest => diarahkan ke apa, misal hex berarti hexadesimal
    return Crypto.createHmac("sha256", "individual-project-purwadhika")
      .update(password)
      .digest("hex");
  },

  createToken: (payload) => {
    // payload berisi data apa saja yang mau diubah menjadi token
    //.sign berisi datanya dan key/kunci bisa dibedakan dengan yang hashPassword
    let token = jwt.sign(payload, "individual-project-purwadhika", {
      expiresIn: "12h",
    });

    return token;
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
