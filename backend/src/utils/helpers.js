import fs from "fs"

export const getRandomNumber = (max) => {
  return Math.floor(Math.random() * max)
}

export const removeLocalFile = (localPath) => {
  fs.unlink(localPath, (err) => {
    if (err) console.log("Error while removing local files", err);
    else {
      console.log("Removed file: ", localPath);
    }
  })
} 