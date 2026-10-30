const assert = require("node:assert/strict");
const test = require("node:test");
const usersRepo = require("../src/repos/users.repo");
const profilesRepo = require("../src/repos/profiles.repo");
const profilesService = require("../src/services/profiles.service");

test("el listado de perfiles usa solo usuarios activos y no eliminados", async () => {
  const originalGetUsers = usersRepo.getAll;
  const originalGetProfiles = profilesRepo.getAll;
  let userFilter;
  let profileUserIds;

  usersRepo.getAll = async (filter) => {
    userFilter = filter;
    return [{ _id: "active-user-1" }, { _id: "active-user-2" }];
  };
  profilesRepo.getAll = async (userIds) => {
    profileUserIds = userIds;
    return ["active-profile"];
  };

  try {
    const result = await profilesService.getProfiles();
    assert.deepEqual(userFilter, { isActive: true });
    assert.deepEqual(profileUserIds, ["active-user-1", "active-user-2"]);
    assert.deepEqual(result, ["active-profile"]);
  } finally {
    usersRepo.getAll = originalGetUsers;
    profilesRepo.getAll = originalGetProfiles;
  }
});
