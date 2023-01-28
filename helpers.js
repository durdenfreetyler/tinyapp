const { urlDatabase } = require("./database")

const generateRandomString = function (length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  
    return result;
  };

  const urlsForUser = function (id) {
    const result = {};
    for (const shortUrlId in urlDatabase) {
      if (id === urlDatabase[shortUrlId].userID) {
        result[shortUrlId] = urlDatabase[shortUrlId].longURL;
      }
    }
 
    return result;
  };

  const getUserByEmail = function (email, users) {
    for (const userId in users) {
      const user = users[userId];
  
      if (user.email === email) {
        return user;
      }
    }
  };

  module.exports = { generateRandomString, urlsForUser, getUserByEmail } 