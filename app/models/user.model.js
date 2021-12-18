const sql = require("./db");

// constructor
const User = function (user) {
  this.name = user.name;
  this.password = user.password;
  this.acc_type = user.accType;
};

User.create = async (newUser, callback) => {
  try {
    // destructure name and pw
    const { name, password, acc_type } = newUser;
    const [rows] = await sql.execute("INSERT INTO `user` (name, password, acc_type) VALUES (?, ?, ?);", [name, password, acc_type]);
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

User.updatePassword = async (user_id, newPassword, callback) => {
  try {
    const [result] = await sql.execute(`UPDATE user SET password = ? WHERE user_id = ?`, [newPassword, user_id]);
    callback(null, result);
  } catch (err) {
    callback(err, null);
  }
};

User.saveProfileInfo = async (options, callback) => {
  const { user_id, profession, email, date_of_birth, contact_number, address, facebook, linkedin } = options;
  try {
    //
    const [exisitingInfo] = await sql.execute("SELECT * FROM profile_info WHERE user_id = ?", [user_id]);
    if (exisitingInfo.length > 0) {
      await sql.execute("DELETE FROM profile_info WHERE user_id = ?", [user_id]);
    }

    const [res] = await sql.execute(
      "INSERT INTO profile_info (user_id, profession, email, date_of_birth, contact_number,  address, facebook, linkedin) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      [user_id, profession, email, date_of_birth, contact_number || null, address || null, facebook || null, linkedin || null]
    );

    callback(null, res);
  } catch (err) {
    callback(err, null);
  }
};

User.findProfileInfo = async (user_id, callback) => {
  try {
    const [res] = await sql.execute("SELECT * FROM profile_info WHERE user_id = ?;", [user_id]);

    const filteredRes = {};

    Object.keys(res[0]).forEach((key) => {
      if (res[0][key]) filteredRes[key] = res[0][key];
    });

    callback(null, filteredRes);
  } catch (err) {
    callback(err, null);
  }
};

module.exports = User;
