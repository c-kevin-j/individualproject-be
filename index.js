const express = require('express')
const app = express()
const cors = require('cors');
const dotenv = require("dotenv"); // menyimpan value ke dalam env variable
// const mysql = require('mysql')

dotenv.config();

const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

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
app.use((error,req,res,next)=>{  
  console.log(error);
  res.status(500).send(error)
})

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