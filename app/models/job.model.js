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

    // a helper function to reformat our tags and stuffs
    // basically all it does is it's changing ['a', 'b', 'c'] into [['a', id], ['b', id], ['c', id]]
    // this is because we need to do bulk insertion into mysql and its the easiest way: doubled-nested-array
    const reformat = (myArray, jobId) => myArray.map((item) => [item, jobId]);

    // reformatting the three properties to be inserted later.
    // why? because it's a list and we need to store each of them in its own seperate table.
    const tables = { tags: [], responsibilities: [], requirements: [] };
    const tableName = ["tags", "responsibilities", "requirements"];
    let error = null;
    tableName.forEach((item) => {
      if (newJob[item].length === 0) {
        error = item;
      } else {
        tables[item] = reformat(newJob[item], rows.insertId);
      }
    });

    if (error) return callback({ message: `${item} cannot be empty.` }, null);

    // insert the three array into its own table
    const queryOne = sql.query("INSERT INTO tag (value, job_id) VALUES ?", [tables.tags]);
    const queryTwo = sql.query("INSERT INTO requirement (value, job_id) VALUES ?", [tables.requirements]);
    const queryThree = sql.query("INSERT INTO responsibility (value, job_id) VALUES ?", [tables.responsibilities]);

    // this is to run the three query in parallel
    await Promise.all([queryOne, queryTwo, queryThree]);

    // return the job back with the job_id
    callback(null, { ...newJob, job_id: rows.insertId });
  } catch (err) {
    callback(err, null);
  }
};

Job.find = async (offset, limit, options, keyword, user_id, callback) => {
  // some jobs dont have tags so we return default values
  // also category and level are not needed to be sent back, we just need it for the query
  // so now we're removing it so we dont send unnecessary data
  // also check if each job is user's favorite
  const reformat = (jobs, favJobIds) => {
    jobs.forEach((job) => {
      delete job.category;
      delete job.level;
    });
    const updatedJobs = jobs.map((job) => (favJobIds.includes(job.job_id) ? { ...job, favorite: true } : { ...job, favorite: false }));
    return updatedJobs;
  };

  //helper function to check if a given object is empty
  const isObjEmpty = (obj) => Object.keys(obj).length === 0;

  // this sql query is
  // SELECT * FROM
  // (SELECT JSON_ARRAYAGG(tag.value) as 'tags', tag.job_id from tag group by tag.job_id) t1
  // RIGHT JOIN
  // (SELECT name, job_type, location, salary, job_id, img, industry, level, category FROM job) t2
  // on t1.job_id = t2.job_id
  // WHERE ${search conditions}
  // ORDER BY t2.job_id
  // LIMIT ${limit}
  // OFFSET ${offset};
  const queryPartOne = `SELECT * FROM (SELECT JSON_ARRAYAGG(tag.value) as 'tags', tag.job_id from tag group by tag.job_id) t1 RIGHT JOIN (SELECT name, job_type, location, salary, job_id, img, industry, level, category FROM job) t2 on t1.job_id = t2.job_id`;
  const queryPartTwo = `ORDER BY t2.job_id LIMIT ${limit} OFFSET ${offset}`;
  let mainQuery = "";
  let condition = "WHERE ";

  //remove all falsy values from the options (search/query params) object
  Object.keys(options).forEach((key) => !options[key] && delete options[key]);

  //check if options object and keyword is falsy is now empty meaning there's no search terms. If so just run the query
  if (isObjEmpty(options) && !keyword) {
    mainQuery = `${queryPartOne} ${queryPartTwo}`;
  } else if (isObjEmpty(options)) {
    //else if query params are empty but theres a keyword we search for the keyword
    condition += `name LIKE '%${keyword}%'`;
  } else {
    //else, there are query params and we loop through the object and add the where clauses...

    //get the keys from options object
    const keys = Object.keys(options);

    //now loop through key and add condition plus 'AND' keyword except for last key
    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        condition += `${keys[i]} = ${sql.escape(options[keys[i]])} `;
      } else {
        condition += `${keys[i]} = ${sql.escape(options[keys[i]])} AND `;
      }
    }

    if (keyword) condition += `AND name LIKE '%${keyword}%' `;

    //combine the three parts together
    mainQuery = `${queryPartOne} ${condition} ${queryPartTwo}`;
  }

  let favJobIds = [];
  //if there's a user_id, check if each of the job is saved as a favorite job or not
  if (user_id) {
    const favQuery = "SELECT * FROM favorite WHERE user_id = ?;";
    favJobIds = await sql.execute(favQuery, [user_id]);
    favJobIds = favJobIds[0].map((obj) => obj.job_id);
  }

  try {
    const [jobs] = await sql.execute(mainQuery);
    callback(null, reformat(jobs, favJobIds));
  } catch (err) {
    callback(err, null);
  }
};

Job.findById = async ({ job_id, user_id }, callback) => {
  // helper function to select first element and also attach moreJobs to job
  const reformat = (job, moreJobs, isFav, applied) => ({ ...job[0], moreJobs, isFavorite: isFav, applied });

  const mainQuery = "SELECT * FROM job where job_id = ? LIMIT 1";
  const tagQuery = "SELECT JSON_ARRAYAGG(value) as tags, job_id FROM tag GROUP BY job_id";
  const requirementQuery = "SELECT JSON_ARRAYAGG(value) as requirements, job_id FROM requirement GROUP BY job_id";
  const responsibilitiesQuery = "SELECT JSON_ARRAYAGG(value) as responsibilities, job_id FROM responsibility GROUP BY job_id";
  const fullQuery = `SELECT * FROM (${mainQuery}) t1 LEFT JOIN (${tagQuery}) t2 ON t1.job_id = t2.job_id LEFT JOIN (${requirementQuery}) t3 ON t2.job_id = t3.job_id LEFT JOIN (${responsibilitiesQuery}) t4 ON t3.job_id = t4.job_id`;
  try {
    //check if job_id is integer
    if (isNaN(job_id)) throw { message: "Invalid Job Id!" };

    // get the job itself
    const [job] = await sql.execute(fullQuery, [job_id]);

    //check if user is trying to access a job that doesn't exist
    if (!job[0]?.name) return callback({ message: `No job with job id ${job_id} found!` }, null);

    //get (nine) randoms jobs to display below the main job (as related jobs)
    //the query is similiar to the one in job.find
    //I know that using ORDER BY RAND() can be slow and resource consuming
    //but since our table will have at most less than 1k jobs we should be fine.
    //I mean the differences between this query and an efficient would be miniscule at this scale.
    const secondQuery = `SELECT * FROM (SELECT JSON_ARRAYAGG(tag.value) as 'tags', tag.job_id from tag group by tag.job_id) t1 RIGHT JOIN (SELECT name, job_type, location, salary, job_id, img, industry FROM job) t2 on t1.job_id = t2.job_id ORDER BY RAND() LIMIT 9;`;
    const [moreJobs] = await sql.execute(secondQuery);

    //find if job is user fav or not
    let isFav = [];
    if (user_id) {
      const favQuery = "SELECT * FROM favorite WHERE user_id = ? AND job_id = ?";
      isFav = await sql.execute(favQuery, [user_id, job_id]);
      isFav = isFav[0].length > 0;
    } else {
      isFav = false;
    }

    //find if user has applied to job
    let applied = [];
    if (user_id) {
      const appliedQuery = "SELECT * FROM application WHERE employee_id = ? AND job_id = ?";
      applied = await sql.execute(appliedQuery, [user_id, job_id]);
      applied = applied[0].length > 0;
    } else {
      applied = false;
    }

    // call reformat on job to do three things
    // 1. to select the 0 indexed element because job is in format [{job}]
    // 2. attach moreJobs to the job.
    // 3. check if job is user_fav and user has applied
    callback(null, reformat(job, moreJobs, isFav, applied));
  } catch (err) {
    callback(err, null);
  }
};

Job.addFav = async (user_id, job_id, callback) => {
  const query = `INSERT INTO favorite (job_id, user_id) VALUES (?, ?)`;
  try {
    const [res] = await sql.execute(query, [job_id, user_id]);
    callback(null, res);
  } catch (err) {
    callback(err, null);
  }
};

Job.removeFav = async (user_id, job_id, callback) => {
  const query = `DELETE FROM favorite WHERE job_id = ? AND user_id = ?;`;
  try {
    const [res] = await sql.execute(query, [job_id, user_id]);
    callback(null, res);
  } catch (err) {
    callback(err, null);
  }
};

Job.findByFav = async (user_id, callback) => {
  const addFavToAll = (jobs) => jobs.map((job) => ({ ...job, favorite: true }));
  try {
    const favJobIdsQuery = "SELECT JSON_ARRAYAGG(job_id) AS job_ids FROM (SELECT * FROM favorite WHERE user_id = ?) t1;";
    const [[{ job_ids: favJobIds }]] = await sql.execute(favJobIdsQuery, [user_id]);
    const jobsQuery = `SELECT * FROM (SELECT name, job_type, location, salary, job_id, img, industry, level, category FROM job WHERE job_id IN (${favJobIds})) t1 LEFT JOIN (SELECT JSON_ARRAYAGG(value) AS tags, job_id FROM tag GROUP BY job_id) t2 ON t1.job_id = t2.job_id;`;
    const [jobs] = await sql.execute(jobsQuery);
    callback(null, addFavToAll(jobs));
  } catch (err) {
    callback(err, null);
  }
};

Job.findByUser = async (user_id, callback) => {
  try {
    const [applications] = await sql.execute("SELECT * FROM application WHERE employer_id = ?;", [user_id]);
    const [jobs] = await sql.execute("SELECT name, salary, job_id FROM job WHERE user_id = ?;", [user_id]);

    //count applications and group by statuses
    const count = {};
    applications.forEach((app) => {
      if (!count[app?.job_id]) {
        count[app?.job_id] = {};
        count[app?.job_id][app?.status] = 1;
        count[app?.job_id].appCount = 1;
      } else {
        count[app?.job_id][app?.status]++;
        count[app?.job_id].appCount++;
      }
    });

    //loop through count and attach it to jobs with corresponding ids.
    const keys = Object.keys(count);
    let updatedJobs = [...jobs];
    keys.forEach((key) => {
      updatedJobs = updatedJobs.map((item) => (item.job_id == key ? { ...item, ...count[key] } : item));
    });

    callback(null, updatedJobs);
  } catch (err) {
    callback(err, null);
  }
};

module.exports = Job;
