import { faker } from "@faker-js/faker";
import { USERS_COUNT } from "./_constants.js";
import { AvailableUserRoles } from "../constants.js";
import { getRandomNumber, removeLocalFile } from "../utils/helpers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/auth/user.model.js";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Array of fake users
const users = new Array(USERS_COUNT).fill("_").map(() => ({
  avatar: {
    url: faker.internet.avatar(),
    localPath: "",
  },
  username: faker.internet.username(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  isEmailVerified: true,
  role: AvailableUserRoles[getRandomNumber(2)],
}));

const seedUsers = asyncHandler(async (req, res, next) => {
  const userCount = await User.count();
  if (userCount >= USERS_COUNT) {
    next();
    return;
  }

  await User.deleteMany({});

  // remove credential.json file
  removeLocalFile("./public/temp/seed-credentials.json")

  const credentials = [];

  const userCreationPromise = users.map(async (user) => {
    credentials.push({
      username: user.username.toLowerCase(),
      password: user.password,
      role: user.role,
    });
    await User.create(user);
  });

  await Promise.all(userCreationPromise());

  const json = JSON.stringify(credentials);

  fs.writeFileSync(
    "./public/temp/seed-credentials.json",
    json,
    "utf8",
    (err) => {
      console.log("Error while writing the credentials", err);
    },
  );

  next();
});

const getGeneratedCredentials = asyncHandler(async (req, res) => {
  const credentials = fs.readFileSync(
    "./public/temp/seed-credentials.json",
    "utf8",
  );
  const json = credentials.json();

  try {
    return res
      .status(200)
      .json(
        new ApiResponse(200, json, "Dummy credentials fetched successfully"),
      );
  } catch (error) {
    new ApiError(
      404,
      "No credentials generated yet. Make sure you have seeded users data first",
    );
  }
});

export {seedUsers, getGeneratedCredentials}