const sql = require("./db");

// constructor
const Job = function (job) {
  this.name = job.name;
  this.user_id = job.user_id;
  this.job_type = job.job_type;
  this.qualification = job.qualification;
  this.level = job.level;
  this.salary = job.salary;
  this.industry = job.industry;
  this.category = job.category;
  this.location = job.location;
  this.available_position = job.available_position;
  this.gender = job.gender;
  this.language = job.language;
  this.required_skills = job.required_skills;
  this.description = job.description;
  this.tags = job.tags;
  this.responsibilities = job.responsibilities;
  this.requirements = job.requirements;
  this.img = job.img;
  this.age = job.age;
};

Job.create = async (newJob, callback) => {
  // a helper function to reformat our tags and stuffs
  // basically all it does is it's changing ['a', 'b', 'c'] into [['a', id], ['b', id], ['c', id]]
  // this is because we need to do bulk insertion into mysql and its the easiest way: doubled-nested-array
  const reformat = (myArray, jobId) => myArray?.map((item) => [item, jobId]);

  // destructure all props of newJob that was initialized in the constructor
  const { name, user_id, job_type, qualification, level, salary, industry, img } = newJob;
  const { category, location, available_position, gender, language, required_skills, description, age } = newJob;

  // combine the props into a list to be inserted into db later
  const sqlParams1 = [name, user_id, job_type, qualification, level, salary, industry, img];
  const sqlParams2 = [category, location, available_position, gender, language, required_skills, description, age];
  const sqlParams = [...sqlParams1, ...sqlParams2];
  const sqlQuery =
    "INSERT INTO job (name, user_id, job_type, qualification, level, salary, industry, img, category, location, available_position, gender, language, required_skills, description, age) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";

  try {
    // insert job into its table
    const [rows] = await sql.execute(sqlQuery, sqlParams);

    // reformatting the three properties to be inserted later.
    // why? because it's a list and we need to store each of them in its own seperate table.
    const tags = reformat(newJob.tags, rows.insertId);
    const responsibilities = reformat(newJob.responsibilities, rows.insertId);
    const requirements = reformat(newJob.requirements, rows.insertId);

    // insert the three array into its own table
    const queryOne = sql.query("INSERT INTO tag (value, job_id) VALUES ?", [tags]);
    const queryTwo = sql.query("INSERT INTO requirement (value, job_id) VALUES ?", [requirements]);
    const queryThree = sql.query("INSERT INTO responsibility (value, job_id) VALUES ?", [responsibilities]);

    Promise.all([queryOne, queryTwo, queryThree]);

    // return the job back with the job_id
    callback(null, { ...newJob, job_id: rows.insertId });
  } catch (err) {
    callback(err, null);
  }
};

Job.find = async (callback) => {
  // helper function to converts tags from csv form into an array
  const reformat = (jobs) => jobs.map((job) => ({ ...job, tags: job.tags.split(",") }));

  // this sql query is
  // SELECT * FROM
  // (SELECT group_concat(tag.value) as 'tags', tag.job_id from tag group by tag.job_id) t1
  // LEFT JOIN
  // (SELECT name, job_type, location, salary, job_id FROM job) t2
  // on t1.job_id = t2.job_id;
  const sqlQuery =
    "SELECT * FROM (SELECT group_concat(tag.value) as 'tags', tag.job_id from tag group by tag.job_id) t1 LEFT JOIN (SELECT name, job_type, location, salary, job_id FROM job) t2 on t1.job_id = t2.job_id";
  try {
    const [jobs] = await sql.execute(sqlQuery);
    callback(null, reformat(jobs));
  } catch (err) {
    callback(err, null);
  }
};

Job.findById = async (job_id, callback) => {
  //helper function to convert csv from the three tables into arrays
  const reformat = (job) => {
    const updatedJob = job[0];
    if (updatedJob.tags) updatedJob.tags = updatedJob.tags.split(",");
    if (updatedJob.responsibilities) updatedJob.responsibilities = updatedJob.responsibilities.split(",");
    if (updatedJob.requirements) updatedJob.requirements = updatedJob.requirements.split(",");
    return updatedJob;
  };

  // this sql query is:
  // SELECT * FROM
  // (SELECT GROUP_CONCAT(tag.value) as 'tags', tag.job_id from tag where tag.job_id = ${job_id}) t1
  // LEFT JOIN
  // (SELECT GROUP_CONCAT(responsibility.value) as 'responsibilities', responsibility.job_id from responsibility where responsibility.job_id = ${job_id}) t2
  // on t1.job_id = t2.job_id
  // LEFT JOIN
  // (SELECT GROUP_CONCAT(requirement.value) as 'requirements', requirement.job_id from requirement where requirement.job_id = ${job_id}) t3
  // on t2.job_id = t3.job_id
  // LEFT JOIN
  // (SELECT * FROM job where job.job_id = ${job_id}) t4
  // on t3.job_id = t4.job_id

  const sqlQuery = `SELECT * FROM (SELECT GROUP_CONCAT(tag.value) as 'tags', tag.job_id from tag where tag.job_id = ${job_id}) t1 LEFT JOIN (SELECT GROUP_CONCAT(responsibility.value) as 'responsibilities', responsibility.job_id from responsibility where responsibility.job_id = ${job_id}) t2 on t1.job_id = t2.job_id LEFT JOIN (SELECT GROUP_CONCAT(requirement.value) as 'requirements', requirement.job_id from requirement where requirement.job_id = ${job_id}) t3 on t2.job_id = t3.job_id LEFT JOIN (SELECT * FROM job where job.job_id = ${job_id}) t4 on t3.job_id = t4.job_id`;
  try {
    //check if job_id is integer
    if (isNaN(job_id)) throw { message: "Invalid Job Id!" };

    const [job] = await sql.execute(sqlQuery);

    //check if user is trying to access a job that doesn't exist
    if (!job[0].name) return callback({ message: `No job with job id ${job_id} found!` }, null);

    // call reformat on job to do two things
    // 1. to select the 0 indexed element because job is in format [{...}]
    // 2. convert csv tables into arrays.
    callback(null, reformat(job));
  } catch (err) {
    callback(err, null);
  }
};

module.exports = Job;
