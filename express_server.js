const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

app.use(cookieParser());

const generateRandomString = function (length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = " ";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomId: {
    id: "userRandomId",
    email: "random@random.com",
    password: 1234,
  },
};
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  console.log(`req.cookies["user_id"]`, req.cookies["user_id"]);
  console.log("users", users);
  // console.log("templateVars:", templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  if (!user) {
    res.redirect("/login");
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
  console.log("-----------------------");
  // console.log("users", users);
  console.log("user_id", userId);
  const user = users[userId];
  console.log("user", user);
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: user,
  };
  console.log("templateVars", templateVars);
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let loggedIn = users[req.cookies.user_id];
  if (!loggedIn) {
    return res.status(403).send("Only logged in users can shorten URL");
  }
  const id = generateRandomString(6);
  urlDatabase[id] = req.body.longURL;
  // console.log("urlDatabase", urlDatabase);
  // get form
  res.redirect(`/urls/${id}`);
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  const id = req.cookies.user_id;
  if (!longURL) {
    return res.status(403).send("This short URL doesn't exist");
  }

  // if (!user) {
  //   res.redirect("/login");
  // }
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const idToDelete = req.params.id;
  delete urlDatabase[idToDelete];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  console.log(req.body);
  console.log(id);
  // console.log("hello");
  urlDatabase[id] = req.body.URL;
  res.redirect("/urls");
});

const userWithEmail = function (users, email) {
  for (const userId in users) {
    const user = users[userId];

    if (user.email === email) {
      return user;
    }
  }
};
app.post("/login", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  console.log("email", email);
  console.log("password", password);
  if (!email || !password) {
    return res.status(400).send("please provide an email and a password");
  }
  const existingUser = userWithEmail(users, email);
  if (!existingUser) {
    return res.status(403).send("no user with that email found");
  }
  if (existingUser.password !== password) {
    return res.status(403).send("the password doesn't match");
  }
  res.cookie("user_id", existingUser.id);

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = { user };
  res.render("register", templateVars);
});
app.post("/register", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  if (!email || !password) {
    return res.status(400).send("please provide an email and a password");
  }
  const existingUser = userWithEmail(users, email);
  if (existingUser) {
    return res
      .status(400)
      .send("there is already a user registered with that email");
  }
  const id = generateRandomString(6);

  users[id] = {
    id: id,
    email: email,
    password: password,
  };
  console.log("!!!!!!!", users);

  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = { user };
  res.render("login", templateVars);
});
