const Profile = require("../models/profile.model");

const getAll = async (userIds = []) => {
  if (userIds.length === 0) return [];
  return Profile.find({ userId: { $in: userIds } })
    .populate("userId", "email")
    .sort({ created_at: -1 });
};

const getByUserId = async (userId) => Profile.findOne({ userId });

const createForUser = async (userId, name) => Profile.create({ userId, name });

const updateByUserId = async (userId, data) => Profile.findOneAndUpdate(
  { userId },
  { $set: data },
  { new: true, runValidators: true }
);

const deleteForUser = async (userId) => Profile.deleteOne({ userId });

module.exports = { getAll, getByUserId, createForUser, updateByUserId, deleteForUser };
