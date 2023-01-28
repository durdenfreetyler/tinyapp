const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { urlDatabase } = require("./database")
const { generateRandomString, urlsForUser, getUserByEmail } = require("./helpers")

const users = {
  userRandomId: {
    id: "userRandomId",
    email: "random@random.com",
    password: 1234,
  },
};

app.set("view engine", "ejs");

app.use(
  cookieSession({
    name: "session",
    keys: ["1234"],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.redirect("/urls")
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res
      .status(403)
      .send("Only logged in users can shorten URLs. Please register or login.");
  }

  const templateVars = {
    urls: urlsForUser(userId),
    user: users[userId],
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    res.redirect("/login");
  }
  const templateVars = { user: users[userId] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const shortUrl = req.params.id;

  if (!userId) {
    return res
      .status(403)
      .send("Only logged in users can shorten URLs. Please register or login.");
  }

  if (!urlDatabase[shortUrl]) {
    return res.status(403).send("This URL doesn't exist.");
  }

  const usersUrls = urlsForUser(userId);
  if (!usersUrls[shortUrl]) {
    return res.status(403).send("This URL doesn't belong to you.");
  }
 
  const user = users[userId];

  const templateVars = {
    id: shortUrl,
    longURL: urlDatabase[shortUrl].longURL,
    user: user,
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  
  if (!urlDatabase[shortURL]) {
    return res.status(403).send("This short URL doesn't exist");
  }
  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});

// create new url
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(403).send("Only logged in users can shorten URL");
  }
  const shortUrl = generateRandomString(6);
  urlDatabase[shortUrl] = {
    longURL: req.body.longURL,
    userID: userId,
  };

  res.redirect(`/urls/${shortUrl}`);
});

// edit url
app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const shortUrl = req.params.id;

  if (!userId) {
    return res
      .status(403)
      .send("Only logged in users can shorten URLs. Please register or login.");
  }

  if (!urlDatabase[shortUrl]) {
    return res.status(403).send("This URL doesn't exist.");
  }

  const usersUrls = urlsForUser(userId);
  if (!usersUrls[shortUrl]) {
    return res.status(403).send("This URL doesn't belong to you.");
  }

  urlDatabase[shortUrl].longURL = req.body.URL;
  res.redirect("/urls");
});

// delete url
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const shortUrl = req.params.id;

  if (!userId) {
    return res
      .status(403)
      .send("Only logged in users can shorten URLs. Please register or login.");
  }

  if (!urlDatabase[shortUrl]) {
    return res.status(403).send("This URL doesn't exist.");
  }

  const usersUrls = urlsForUser(userId);
  if (!usersUrls[shortUrl]) {
    return res.status(403).send("This URL doesn't belong to you.");
  }

  delete urlDatabase[shortUrl];
  res.redirect("/urls");
});


// login routes
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = { user };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  
  if (!email || !password) {
    return res.status(400).send("please provide an email and a password");
  }

  const existingUser = getUserByEmail(email, users);
  if (!existingUser) {
    return res.status(403).send("no user with that email found");
  }

  if (!bcrypt.compareSync(password, existingUser.password)) {
    return res.status(403).send("the password doesn't match");
  }

  req.session.user_id = existingUser.id;
  res.redirect("/urls");
});

// register routes
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  }

  const templateVars = { user: users[userId] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;

  if (!email || !password) {
    return res.status(400).send("please provide an email and a password");
  }

  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res
      .status(400)
      .send("there is already a user registered with that email");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = generateRandomString(6);

  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword,
  };

  req.session.user_id = userId;
  res.redirect("/urls");
});

// logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
