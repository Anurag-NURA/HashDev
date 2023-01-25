const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const path = require('path');
const methodOverride = require('method-override');
const { comment } = require("postcss");

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


const aboutContent = "This page is all about the technologies used in creating the website. Needless to say but this is a team project created for only education purposes."

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
  password: String,
  admin: Boolean
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
  },
  author: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


const blogSchema = new mongoose.Schema({
  author: String,
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  comment: [CommentSchema]
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
          homePosts: posts
        });
      }
    })
  } else {
    res.redirect("/login");
  }
});



//for registration
app.get("/register", (req, res) => {
  res.render("register");
})
  .post("/register", (req, res) => {
    const { username, password } = req.body;

    if (username === "" || password === "") {
      res.render("message", {
        messageTitle: "Validation Error",
        messageContent: "Please enter valid username and password"
      })
    } else {
      User.register({
        username: username,
      }, password, (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/");
          })
        }
      });
    }
  });



//for login
app
  .get("/login", (req, res) => {
    res.render("login");
  })
  .post("/login", (req, res) => {

  })



//for displaying individual posts
app
  .get("/posts/:postId", (req, res) => {
    const requestedId = req.params.postId;

    if (req.isAuthenticated()) {
      Post.findOne({ _id: requestedId }, (err, post) => {
        if (err) {
          console.log(err);
        } else {
          res.render("post", {
            postTitle: post.title,
            postContent: post.content,
            author: post.author,
            user: req.session.passport.user,
            postId: post._id
          })
        };
      });
    } else {
      res.redirect("/login");
    }
  });


//for writing a comment 
app.get("/:articleId/comments", (req, res) => {
  res.render("comment");
})





//for deleting a post
app.delete("/posts/:postId/delete", (req, res) => {
  const { postId } = req.params;
  const result = Post.findOneAndDelete({ _id: postId });
  result.then((post) => {
    if (!post) {
      res.render("message", {
        messageTitle: "Document not found",
        messageContent: "The Selected Post was not found in the database"
      });
    } else {
      res.render("message", {
        messageTitle: "Deleted successfully",
        messageContent: `The post titled ${post.title} whose author was ${post.author} has been deleted successfully`
      });
    }
  })
    .catch(err => console.log(err));
});




//for editing a post
app
  .get("/posts/:postId/edit", async (req, res) => {
    try {
      const { postId } = req.params;
      const result = await Post.findById(postId);
      res.render("edit", {
        prevTitle: result.title,
        prevContent: result.content,
        postId: result._id
      })
    } catch (err) {
      console.log(err);
    }
  })
  .put("/posts/:postId/edit", async (req, res) => {
    const { updatedTitle, updatedContent } = req.body;
    try {
      Post.findOneAndUpdate({ _id: req.params.postId }, { title: updatedTitle, content: updatedContent }).then(() => {
        res.redirect(`/posts/${req.params.postId}`);
      })
        .catch(err => { console.log(err); });

    } catch (error) {
      console.log(error);
    }
  });



//for about page
app.get("/about", (req, res) => {
  ////renders about.ejs file on "/about" page
  res.render("about", {
    AContent: aboutContent
  });
});



//for compose page
app
  .get("/compose", (req, res) => {
    if (req.isAuthenticated()) {
      //renders compose.ejs file on "/compose" page
      res.render("compose");
    } else {
      res.redirect("/login");
    }
  })
  .post("/compose", async (req, res) => {

    const composePost = new Post({
      author: req.session.passport.user,
      title: req.body.composeText,
      content: req.body.composePost
    });
    try {
      await composePost.save();
      res.redirect("/");
    } catch (error) {
      if (error.name === "ValidationError") {
        res.render("message", {
          messageTitle: "Validation Error",
          messageContent: "Please fill in the title and content field to be able to publish the post"
        })
      } else { console.log(error); }
    }
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
