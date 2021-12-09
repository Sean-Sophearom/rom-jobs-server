const Job = require("../models/job.model");

// create and save new user aka register account
exports.createJob = (req, res) => {
  if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

  //create a new job
  const job = new Job({ ...req.body, user_id: req.user.user_id });

  //save to db
  Job.create(job, (err, data) => {
    console.log(err);
    if (err) return res.status(400).json({ message: err.message });
    res.status(201).json(data);
  });
};

exports.getAllJobs = (req, res) => {
  Job.find((err, data) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(200).json(data);
  });
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  Job.findById(id, (err, data) => {
    if (err) return res.json(err);
    res.json(data);
  });
};
