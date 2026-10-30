const Profile = require("../models/profile.model");

const getAllRaw = async () => Profile.find().sort({ created_at: -1 }).lean();

const getByUserId = async (userId) => Profile.findOne({ userId });

const createForUser = async (userId, name) => Profile.create({ userId, name });

const updateByUserId = async (userId, data) => Profile.findOneAndUpdate(
  { userId },
  { $set: data },
  { new: true, runValidators: true }
);

const deleteForUser = async (userId) => Profile.deleteOne({ userId });

module.exports = { getAllRaw, getByUserId, createForUser, updateByUserId, deleteForUser };
