import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

const app = express();
const port = 3000;
const saltRounds = 10;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: "mysmolbigagedcat",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://0.0.0.0:27017/userAuthDB");

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const Credentials = mongoose.model("credentials", userSchema);

passport.use(Credentials.createStrategy());
passport.serializeUser(Credentials.serializeUser());
passport.deserializeUser(Credentials.deserializeUser());

app.get("/", (req, res) => {
    res.render("home",{});
});

app.get("/login", (req, res) => {
    res.render("login",{});
});

app.get("/register", (req, res) => {
    res.render("register",{});
});

app.get("/secrets", (req, res) => {
   
    if(req.isAuthenticated){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req,res) => {
    req.logOut(function(err) {
        if(err) {
            console.log(err);
            next();
        }
        else {
            res.redirect("/");
        }
    });
});

app.get("/loginfail", (req, res) => {
    res.redirect("/login");
});

app.post("/register", (req, res) => {
    Credentials.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login", (req, res) => {
    const user = new Credentials({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local", { failureRedirect: '/loginfail' })(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});