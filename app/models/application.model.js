const sql = require("./db");
const CV = require("./cv.model");

const Application = function (cv) {
  this.employee_id = cv.user_id;
  this.job_id = cv.job_id;
  this.message = cv.message || "";
  this.status = cv.status || "pending";
};

Application.create = async (newApp, callback) => {
  const { employee_id, job_id, status, message } = newApp;

  try {
    const [cv] = await sql.execute("SELECT * FROM user_info WHERE user_id = ?;", [employee_id]);
    if (cv.length === 0) return callback({ code: "no_cv", message: "Please create a CV first." }, null);

    const [response] = await sql.execute("SELECT job_id, user_id FROM job WHERE job_id = ?", [job_id]);
    const employer_id = response[0].user_id;

    if (!employer_id) return callback({ message: "Invalid Job Id!" }, null);

    const queryValues = [employer_id, employee_id, job_id, status, message];
    const queryString = "INSERT INTO application (employer_id, employee_id, job_id, status, message) VALUES (?, ?, ?, ?, ?);";
    const [res] = await sql.execute(queryString, queryValues);
    callback(null, { message: "Successfully applied to job." });
  } catch (err) {
    callback(err, null);
  }
};

Application.updateStatus = async ({ application_id, newStatus, newMessage, employer_id }, callback) => {
  try {
    //check if user(employer) is trying to update a job which they're not authorized to update.
    const [job] = await sql.execute("SELECT id, employer_id FROM application WHERE id = ?", [application_id]);
    if (job[0].employer_id === employer_id) {
      let queryValues;
      let queryString;

      //when employer reject or accept an application, the message is optional.
      if (newMessage) {
        queryString = "UPDATE application SET status = ?, message = ? WHERE id = ?";
        queryValues = [newStatus, newMessage, application_id];
      } else {
        queryString = "UPDATE application SET status = ? WHERE id = ?";
        queryValues = [newStatus, application_id];
      }
      const [res] = await sql.execute(queryString, queryValues);
      callback(null, { message: "Successfully updated application." });
    } else {
      throw { message: "User not authorized to accept or reject application!" };
    }
  } catch (err) {
    callback(err, null);
  }
};

Application.findByEmployee = async (employee_id, callback) => {
  const queryString =
    "SELECT * FROM (SELECT * FROM application WHERE employee_id = ?) t1 LEFT JOIN (SELECT name as job_name, job_id FROM job) t2 on t1.job_id = t2.job_id;";
  try {
    const [res] = await sql.execute(queryString, [employee_id]);
    res.forEach((item) => delete item.employer_id);
    callback(null, res);
  } catch (err) {
    callback(err, null);
  }
};

Application.findByEmployer = async (employer_id, callback) => {
  const queryString =
    "SELECT * FROM (SELECT * FROM application WHERE employer_id = ?) t1 LEFT JOIN (SELECT name as job_name, job_id FROM job) t2 on t1.job_id = t2.job_id LEFT JOIN (SELECT * FROM user_info) t3 ON t1.employee_id = t3.user_id";
  try {
    const [res] = await sql.execute(queryString, [employer_id]);
    callback(null, res);
  } catch (err) {
    callback(err, null);
  }
};

Application.findById = async (id, type, user_id, callback) => {
  const queryString = "SELECT * FROM (SELECT * FROM application WHERE id = ?) t1 LEFT JOIN (SElECT * FROM job) t2 on t1.job_id = t2.job_id;";

  try {
    const [res] = await sql.execute(queryString, [id]);
    const appDetail = res[0];
    if (Object.keys(appDetail).length === 0) return callback({ message: "Invalid Application Id." }, null);
    if (appDetail[`${type}_id`] !== user_id) return callback({ message: "User not authorized to access this application." }, null);
    const { employee_id } = appDetail;
    CV.findByUser(employee_id, (err, data) => {
      if (err) return callback(err, null);
      callback(null, { application: appDetail, cv: data });
    });
  } catch (err) {
    callback(err, null);
  }
};

module.exports = Application;
