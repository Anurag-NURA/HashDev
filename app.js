const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "This page is all about the technologies used in creating the website. Needless to say but this is a team project created for only education purposes."
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.use(session({
  secret: "Something secret is here.",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/blogDB")
  .then(() => {
    console.log("Connection established!!!");
  })
  .catch((err) => { console.log(err); });



const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const blogSchema = new mongoose.Schema({
  author: String,
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  }
});
const Post = mongoose.model('Post', blogSchema);


//for home page
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    //renders home.ejs file on "/" page
    Post.find({}, (err, posts) => {
      if (err) {
        console.log(err);
      } else {
        res.render("home", {
          startingContent: homeStartingContent,
          homePosts: posts
        });
      }
    })
  } else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  User.register({
    username: req.body.username,
  }, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/");
      })
    }
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect('/');
      });
    }
  })
});



app.get("/posts/:postId", (req, res) => {
  const requestedId = req.params.postId;

  if (req.isAuthenticated()) {
    Post.findOne({ _id: requestedId }, (err, post) => {
      if (err) {
        console.log(err);
      } else {
        res.render("post", {
          postTitle: post.title,
          postContent: post.content
        })
      };
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/posts/:postId", (req, res) => {
  Post.findOne({ _id: req.params.postId }, (err, post) => {
    if (err) {
      console.log(err);
    } else {
      if (post.author === req.session.passport.user) {
        Post.deleteOne({ _id: req.params.postId }, (err) => {
          if (err) {
            console.log(err);
          } else {
            res.render("message", {
              messageTitle: "Post deleted",
              messageContent: "The post has been deleted successfully"
            });
          }
        })
      } else {
        res.render("message", {
          messageTitle: "Unauthorized Action",
          messageContent: "You are not the creator of this post"
        });
      }
    }
  });
});



//for about page
app.get("/about", (req, res) => {
  ////renders about.ejs file on "/about" page
  res.render("about", {
    AContent: aboutContent
  });
});



//for compose page
app.get("/compose", (req, res) => {
  if (req.isAuthenticated()) {
    //renders compose.ejs file on "/compose" page
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", async (req, res) => {

  const composePost = new Post({
    author: req.session.passport.user,
    title: req.body.composeText,
    content: req.body.composePost
  });

  await composePost.save((err) => {
    if (err) {
      //if saving fails
      console.log(err);
    } else {
      //than redirected to the home page to display the composed post
      res.redirect("/");
    }
  });
});



app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  });
  res.redirect("/");
});


app.listen(8000, function () {
  console.log("Server started on port 8000");
});
