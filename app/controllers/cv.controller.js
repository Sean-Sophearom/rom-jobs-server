const CV = require("../models/cv.model");

exports.createCV = (req, res) => {
  if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

  //create a new cv
  const cv = new CV({ ...req.body, user_id: req.user.user_id });

  //save to db
  CV.create(cv, (err, data) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ message: "Successfully created CV." });
  });
};

exports.findByUser = (req, res) => {
  const user_id = req.params.id;

  if (!user_id) return res.status(400).json({ message: "Please provide a user id." });

  if (isNaN(user_id)) return res.status(400).json({ message: "Please provide a valid user id." });

  CV.findByUser(user_id, (err, data) => {
    if (err) return res.status(400).json({ message: err.message });
    res.status(200).json(data);
  });
};

exports.deleteByUser = (req, res) => {
  //get from token so we can be sure that it's the owner trying to delete their own cv
  const user_id = req.user.user_id;

  CV.deleteByUser(user_id, (err, data) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json(data);
  });
};

exports.updateByUser = (req, res) => {
  const user_id = req.user.user_id;

  if (!req.body) return res.status(400).json({ message: "Content cannot be empty!" });

  //delete old cv
  CV.deleteByUser(user_id, (err) => {
    if (err) return res.status(500).json({ message: err.message });

    //create a new cv
    const cv = new CV({ ...req.body, user_id });

    //save to db
    CV.create(cv, (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ message: "Successfully updated CV." });
    });
  });
};
