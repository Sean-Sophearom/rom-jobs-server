const Application = require("../models/application.model");

exports.create = (req, res) => {
  const { job_id } = req.body;
  const { user_id } = req.user;

  if (!job_id || isNaN(job_id)) return res.status(400).json({ message: "Please provide a valid job id." });

  const newApp = new Application({ job_id, user_id });

  Application.create(newApp, (err, data) => {
    if (err?.code === "no_cv") return res.status(400).json(err);
    if (err) return res.status(500).json(err);
    res.status(200).json(data);
  });
};

exports.updateStatus = (req, res) => {
  const { user_id } = req.user;
  const { status, message } = req.body;
  const { id } = req.params;

  //id is application id
  if (!id || !status) return res.status(400).json({ message: "Please provide enough detail to update Application." });

  const options = {
    employer_id: user_id,
    application_id: id,
    newStatus: status,
    newMessage: message,
  };

  Application.updateStatus(options, (err, data) => {
    if (err) return res.status(500).json(err);
    res.status(200).json(data);
  });
};

exports.find = (req, res) => {
  const { user_id, acc_type } = req.user;

  const callback = (err, data) => {
    if (err) return res.status(500).json(err);
    res.status(200).json(data);
  };

  if (acc_type === "employee") {
    Application.findByEmployee(user_id, callback);
  } else {
    Application.findByEmployer(user_id, callback);
  }
};

exports.findById = (req, res) => {
  const { user_id, acc_type } = req.user;
  const { id } = req.params;

  if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid Application Id!", type: "not_found" });

  Application.findById(id, acc_type, user_id, (err, data) => {
    if (err) return res.status(500).json(err);
    res.status(200).json(data);
  });
};
