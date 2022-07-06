const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv"); // menyimpan value ke dalam env variable
// const mysql = require('mysql')
const bearerToken = require("express-bearer-token");

dotenv.config();

const PORT = process.env.PORT;

// memberi ijin pada browser / fe supaya bisa langsung mengakses direktori yang ditentukan
app.use(express.static("public"));

app.use(express.json());

app.use(cors({
  credentials: true,
  // origin:'http://localhost:3000'
}));
app.options('*', cors())

// const allowCORS= app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });
// var corsOptions = {
//   origin: 'https://individualproject-3gdh0lyz1-c-kevin-j.vercel.app/',
// }

app.use(bearerToken());

// DB Check Connection
const { dbConf } = require("./config/database");
dbConf.getConnection((error, connection) => {
  if (error) {
    console.log("Error MySQL Connection ", error.message, error.sqlMessage);
  }

  // console.log(`Connected to MySQL Server ✅ : ${connection.threadId}`);
  console.log(`Connected to MySQL Server ✅`);
});

//////////////////////////////////////////

app.get("/", (req, res) => {
  res.status(200).send("tes");
});

// Handling error => menangkap error dari controller
app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).send(error);
});

app.listen(PORT, () => console.log(`RUnning API at PORT ${PORT}`));

const { usersRouter, postsRouter } = require("./routers");
app.use("/users", usersRouter);
app.use("/posts", postsRouter);

// const db = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: 'password',
//     database: 'socialmediadb',
// })

// app.get("/", (req, res) => {
//     const sqlInsert = "INSERT INTO user (first_name, last_name, email, password, profile_picture, bio, verified_status) VALUES ('Kaguya', 'sama', 'kaguya@sama.com', 'pass', 'prf', 'bio', 1);"
//     db.query(sqlInsert, (err, result) => {
//         res.send("hello ehe k");
//         console.log(err)
//     })
// })

// app.listen(3001, () => {
//     console.log('run on port 3001')
// })
