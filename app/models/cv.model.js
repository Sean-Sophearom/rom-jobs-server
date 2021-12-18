const sql = require("./db");

// constructor
const CV = function (cv) {
  this.user_id = cv.user_id;
  this.user_info = cv.user_info;
  this.work_exp = cv.work_exp;
  this.education = cv.education;
  this.achievement = cv.achievement;
  this.language = cv.language;
  this.skill = cv.skill;
  this.reference = cv.reference;
};

CV.create = async (cv, callback) => {
  //destructure user_id to be used below.
  const user_id = cv.user_id;

  //START OF USER INFO QUERY CONSTRUCTION
  const { first_name, last_name, contact_number, email, date_of_birth, job_title, job_level, industry, address, city, country, github, description } =
    cv.user_info;
  const user_info_values = [
    first_name,
    last_name,
    contact_number,
    email,
    date_of_birth,
    job_title,
    job_level,
    industry,
    address,
    city,
    country,
    github,
    description,
    user_id,
  ];
  const user_info_query =
    "INSERT INTO user_info (first_name, last_name, contact_number, email, date_of_birth, job_title, job_level, industry, address, city, country, github, description, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
  //END OF USER INFO QUERY CONSTRUCTION

  let work_exp_query, work_exp_values, education_query, education_values, achievement_query, achievement_values;
  let language_query, language_values, skill_query, skill_values, reference_query, reference_values;

  //START OF WORK EXPERIENCE QUERY CONSTRUCTION
  if (cv.work_exp?.length >= 1) {
    work_exp_values = cv.work_exp.map(({ job_title, job_level, company, type_of_exp, city, country, start_date, end_date, description }) => [
      job_title,
      job_level,
      company,
      type_of_exp,
      city,
      country,
      start_date,
      end_date,
      description,
      user_id,
    ]);
    work_exp_query = "INSERT INTO work_exp (job_title, job_level, company, type_of_exp, city, country, start_date, end_date, description, user_id) VALUES ?";
  }
  //END OF WORK EXPERIENCE QUERY CONSTRUCTION

  //START OF EDUCATION QUERY CONSTRUCTION
  if (cv.education?.length >= 1) {
    education_values = cv.education.map(({ school, degree, major, city, country, start_date, end_date, description }) => [
      school,
      degree,
      major,
      city,
      country,
      start_date,
      end_date,
      description,
      user_id,
    ]);
    education_query = "INSERT INTO education (school, degree, major, city, country, start_date, end_date, description, user_id) VALUES ?";
  }
  //END OF EDUCATION QUERY CONSTRUCTION

  //START OF ACHIEVEMENT QUERY CONSTRUCTION
  if (cv.achievement?.length >= 1) {
    achievement_values = cv.achievement.map(({ title, date }) => [title, date, user_id]);
    achievement_query = "INSERT INTO achievement (title, date, user_id) VALUES ?";
  }
  //END OF ACHIEVEMENT QUERY CONSTRUCTION

  //START OF LANGUAGE QUERY CONSTRUCTION
  if (cv.language?.length >= 1) {
    language_values = cv.language.map(({ language, level }) => [language, level, user_id]);
    language_query = "INSERT INTO language (language, level, user_id) VALUES ?";
  }
  //END OF LANGUAGE QUERY CONSTRUCTION

  //START OF SKILL QUERY CONSTRUCTION
  if (cv.skill?.length >= 1) {
    skill_values = cv.skill.map(({ skill, level }) => [skill, level, user_id]);
    skill_query = "INSERT INTO skill (skill, level, user_id) VALUES ?";
  }

  //END OF SKILL QUERY CONSTRUCTION

  //START OF REFERENCE QUERY CONSTRUCTION
  if (cv.reference?.length >= 1) {
    reference_values = cv.reference.map(({ name, position, company, contact_number, email }) => [name, position, company, contact_number, email, user_id]);
    reference_query = "INSERT INTO reference (name, position, company, contact_number, email, user_id) VALUES ?";
  }
  //END OF REFERENCE QUERY CONSTRUCTION

  const query_values_arr = [
    { query: work_exp_query, values: work_exp_values },
    { query: education_query, values: education_values },
    { query: achievement_query, values: achievement_values },
    { query: language_query, values: language_values },
    { query: skill_query, values: skill_values },
    { query: reference_query, values: reference_values },
  ];

  const queries = query_values_arr.map((query) => query.values && sql.query(query.query, [query.values]));

  queries.push(sql.query(user_info_query, user_info_values));

  //   const queryOne = sql.execute({query: user_info_query, values: user_info_values});
  //   const queryTwo = sql.execute({query: work_exp_query, values: work_exp_values});
  //   const queryThree = sql.execute({query: education_query, values: education_values});
  //   const queryFour = sql.execute({query: achievement_query, values: achievement_values});
  //   const queryFive = sql.execute({query: language_query, values: language_values});
  //   const querySix = sql.execute({query: skill_query, values: skill_values});
  //   const querySeven = sql.execute({query: reference_query, values: reference_values});

  try {
    await Promise.all(queries);
    callback(null, { message: "Success" });
  } catch (err) {
    callback(err, null);
  }
};

CV.findByUser = async (user_id, callback) => {
  const tableNames = ["user_info", "work_exp", "education", "achievement", "language", "skill", "reference"];
  const queries = [];
  tableNames.forEach((table) => queries.push(sql.execute(`SELECT * FROM ${table} WHERE user_id = ?`, [user_id])));

  try {
    const res = await Promise.all(queries);

    //initialize data
    const data = {};

    // item[0] at the end of line to select first items from each table query cause it returns [rows, fields]
    // also filter out empty tables since some cv can have empty tables
    res.forEach((item, index) => {
      if (item[0]?.length > 0) data[tableNames[index]] = item[0];
    });

    //map through and remove user_id from tables;
    const keys = Object.keys(data);
    keys.forEach((key) => {
      if (data[key]?.length) data[key] = data[key].map((item) => ({ ...item, user_id: undefined }));
    });

    //check if query return nothing
    if (!data?.user_info?.length) return callback({ message: "CV does not exist." }, null);

    //user_info is treated differently because it is never an array because someone can only have one user_info
    //but our query always return [user_info]
    data.user_info = data.user_info[0];
    data.user_info.user_id = user_id;

    callback(null, data);
  } catch (err) {
    callback(err, null);
  }
};

CV.deleteByUser = async (user_id, callback) => {
  const tableNames = ["user_info", "work_exp", "education", "achievement", "language", "skill", "reference"];
  const queries = [];
  tableNames.forEach((table) => queries.push(sql.execute(`DELETE FROM ${table} WHERE user_id = ?`, [user_id])));
  try {
    await Promise.all(queries);
    callback(null, { message: "Success" });
  } catch (err) {
    callback(err, null);
  }
};

module.exports = CV;
