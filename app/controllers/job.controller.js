const Job = require("../models/job.model");
const jwt = require("jsonwebtoken");

// create and save new user aka register account
exports.createJob = (req, res) => {
  if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

  //create a new job
  const job = new Job({ ...req.body, user_id: req.user.user_id });

  //save to db
  Job.create(job, (err, data) => {
    if (err) return res.status(400).json({ message: err.message });
    res.status(201).json(data);
  });
};

exports.getAllJobs = async (req, res) => {
  //get page from query params else default to 0 so 0 times anything = offset by 0
  const page = req.query.page || 0;
  let user_id = null;

  //START OF PARSE REQ.HEADERS.AUTH
  //parse req.headers.auth to get user_id cause its optional
  //why get user_id? to check whether each job we fetch is their favorite or not.
  const token = req?.header("Authorization")?.split(" ")[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    user_id = verified.user_id;
  } catch (error) {
    //do nothing
  }
  //END OF PARSE REQ.HEADERS.AUTH

  //destructure query params
  const { level, industry, category, job_type, location, keyword, sort } = req.query;
  const options = { level, industry, category, job_type, location, sort };

  //values of job per page
  const JOB_PER_PAGE = 6;

  //multiply page by num_job_per_page to get offset
  const offset = page * JOB_PER_PAGE;

  //check if offset isNan meaning the user provided a page number query that is actually a string
  if (isNaN(offset)) return res.status(400).json({ message: "Invalid page number" });

  Job.find(offset, JOB_PER_PAGE, options, keyword, user_id, (err, data) => {
    if (err?.code === "ER_EMPTY_QUERY") return res.status(404).json({ message: err.message });
    if (err) return res.status(500).json({ message: err.message });
    res.status(200).json(data);
  });
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  let user_id = null;

  //START OF PARSE REQ.HEADERS.AUTH
  //parse req.headers.auth to get user_id cause its optional
  //why get user_id? to check whether the job we fetch is their favorite or not.
  //using let cause we'll have to remove the BEARER part later
  const token = req?.header("Authorization")?.split(" ")[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    user_id = verified.user_id;
  } catch (error) {
    //do nothing
  }
  //END OF PARSE REQ.HEADERS.AUTH
  Job.findById({ job_id: id, user_id }, (err, data) => {
    if (err) return res.status(500).json(err);
    res.status(200).json(data);
  });
};

exports.addFav = (req, res) => {
  const job_id = req.params.id;
  const user_id = req.user.user_id;
  Job.addFav(user_id, job_id, (err, data) => {
    if (err) return res.status(500).json(err);
    res.status(200).json(data);
  });
};

exports.removeFav = (req, res) => {
  const job_id = req.params.id;
  const user_id = req.user.user_id;
  Job.removeFav(user_id, job_id, (err, data) => {
    if (err) return res.status(500).json(err);
    res.status(200).json(data);
  });
};

exports.findByFav = (req, res) => {
  const user_id = req.user.user_id;

  Job.findByFav(user_id, (err, data) => {
    if (err) return res.status(500).json(err);
    res.status(200).json(data);
  });
};

exports.findByUser = (req, res) => {
  const user_id = req.user.user_id;
  Job.findByUser(user_id, (err, data) => {
    if (err) return res.status(500).json(err);
    res.status(200).json(data);
  });
};
