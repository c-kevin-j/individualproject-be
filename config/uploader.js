const multer = require("multer");
const fs = require("fs");

//name prefix, contohnya di HP, akan ada IMG di depannya
module.exports = {
  uploader: (directory, fileNamePrefix) => {
    // define lokasi penyimpanan utama
    let defaultDir = "./public";

    // konfigurasi multer
    // diskStorage => mengarahkan disimpan ke mana
    const storageUploader = multer.diskStorage({
      // secara default pakai argumen: request, file, callback
      destination: (req, file, cb) => {
        // menentukan lokasi penyimpanan file
        // cek apakah direktori khusus yang digunakan, jika tidak ada disimpan ke defaultDir
        const pathDir = directory ? defaultDir + directory : defaultDir;

        // melakukan pemeriksaan pathDir (apakah sudha ada direktorinya)
        if (fs.existsSync(pathDir)) {
          // jika direktori ada, maka akan langsung digunakan untuk menyimpan file
          console.log(`Directory ${pathDir} exist ✅`);
          cb(null, pathDir);
        } else {
          // recursive => memmbuat direktori dalam direktori
          fs.mkdir(pathDir, { recursive: true }, (err) => cb(err, pathDir));
          console.log(`Success created ${pathDir} ✅`);
        }
      },

      filename: (req, file, cb) => {
        // membaca tipe data file
        let ext = file.originalname.split(".");

        // membuat filename baru
        let filename = fileNamePrefix + Date.now() + "." + ext[ext.length - 1];

        cb(null, filename);
      },
    });

    // filtering tipe data apa saja yang diperbolehkan untuk diupload
    const fileFilter = (req, file, cb) => {
      // regex ==> metode untuk define data parameter yang jadi acuan untuk melakukan filtering
      const extFilter = /\.(jpg|png|webp|svg|jpeg)/;

      // match untuk mencocokkan dengan regex yang sudah dibuat, ibarat include
      if (!file.originalname.toLowerCase().match(extFilter)) {
        // jika ext tidak sesuai
        return cb(new Error("Your file ext are denied ❌", false));
      }
      cb(null, true);
    };

    return multer({ storage: storageUploader, fileFilter });
  },
};
