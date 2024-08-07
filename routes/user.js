import express from "express";
const router = express.Router();
import cors from "cors";

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

router.post("/login", async (req, res) => {
  console.log(req.body)
  try {
    const result = await req.db.query(`SELECT * FROM user_info WHERE email = '${req.body.email}' and password = '${req.body.password}'`);
    if (result.rows.length !== 0) {
      res.send(result.rows);
    } else {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }
  } catch (err) {
    console.log(err)
  }
});

router.post("/signup", async (req, res) => {
  try {
    const signup = await req.db.query
    (`INSERT INTO user_info (email, password)
    VALUES ('${req.body.email}', '${req.body.password}')`)
    res.send(signup.rows);
  } catch (err) {
    console.log(err)
  }
})

//Show User Details with works
router.get("/user_info", cors(corsOptions), async(req, res) => {
  try {
    const userInfo = await req.db.query
    (`SELECT * FROM user_info WHERE user_id = ${req.headers.user_id}`)
    res.send(userInfo.rows);
  } catch (err) {
    console.log(err)
  }
} )

//Update User Info
router.put("/update_user", async (req, res) => {
  try {
    const updateUserInfo = await req.db.query
    (`UPDATE user_info 
    SET first_name ='${req.body.first_name}', 
    surname = '${req.body.surname}', 
    date_of_birth = '${req.body.date_of_birth}',
    password = '${req.body.password}'
    WHERE user_id = '${req.headers.user_id}'`)
    res.send(updateUserInfo.rows);
  } catch (err) {
    console.log(err)
    res.status(400).send("Something went wrong")
  }
})

//Delete User Account
router.delete("/delete_account", async(req, res) => {
  try {
    const deletedAccount = await req.db.query(`DELETE FROM user_info WHERE user_id = ${req.headers.user_id}`);
    res.send(deletedAccount)
  } catch (err) {
    console.log(err);
  }
})

export default router;
