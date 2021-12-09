const sql = require("./db");

// constructor
const User = function (user) {
  this.name = user.name;
  this.password = user.password;
  this.accType = user.accType;
};

User.create = async (newUser, callback) => {
  try {
    // destructure name and pw
    const { name, password, accType } = newUser;
    const [rows] = await sql.execute("INSERT INTO `user` (name, password, acc_type) VALUES (?, ?, ?);", [name, password, accType]);
    callback(null, { user_id: rows.insertId, ...newUser });
  } catch (err) {
    callback(err, null);
  }
};

User.findByName = async (name, callback) => {
  try {
    const [rows] = await sql.execute("SELECT * FROM `user` WHERE `name` = ?", [name]);
    if (rows.length) {
      callback(null, rows[0]);
    } else {
      callback({ type: "not_found" }, null);
    }
  } catch (err) {
    callback(err, null);
  }
};

module.exports = User;
