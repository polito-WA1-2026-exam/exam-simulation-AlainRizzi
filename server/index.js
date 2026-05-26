// imports
import express from "express";
import morgan from "morgan";
import cors from "cors";
import {check, validationResult} from 'express-validator'; // validation middleware
import { getCourses, getStudyPlanByStudentID, getStudent, addStudyPlan, updateStudyPlan, deleteStudyPlan } from "./dao.js";

// init express
const app = new express();
const port = 3001;

// middlewares
app.use(express.json());
app.use(morgan("dev"));

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessState: 200,
  credentials: true
};
app.use(cors(corsOptions))

/*** Passport ***/

/** Authentication-related imports **/
import passport from 'passport';                              // authentication middleware
import LocalStrategy from 'passport-local';                   // authentication strategy (username and password)

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUserByCredentials() (i.e., id, username, name).
 **/
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async function verify(email, password, callback) {
    try {
        const user = await getStudent(email, password);
        if(!user)
            return callback(null, false, 'Incorrect email or password');
        return callback(null, user);
    } catch(err) {
        return callback(err);
    }
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) { // this user is id + username + name
    callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email + name
    return callback(null, user); // this will be available in req.user

    // In this method, if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
    // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));
});


/** Creating the session */
import session from 'express-session';

app.use(session({
  secret: "This is a very secret information used to initialize the session!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));


/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({error: 'Not authorized'});
}

/*** Utility Functions ***/

// This function is used to handle validation errors
const onValidationErrors = (validationResult, res) => {
    const errors = validationResult.formatWith(errorFormatter);
    return res.status(422).json({validationErrors: errors.mapped()});
};

// Only keep the error message in the response
const errorFormatter = ({msg}) => {
    return msg;
};

// POST /api/sessions
// This route is used for performing login.
app.post('/api/sessions', function(req, res, next) {
    passport.authenticate('local', (err, student, info) => {
      if (err)
        return next(err);
        if (!student) {
          // display wrong login messages
          return res.status(401).json({ error: info});
        }
        // success, perform the login and extablish a login session
        req.login(student, (err) => {
          if (err)
            return next(err);

          // req.student contains the authenticated student, we send all the student info back
          // in LocalStratecy Verify Function
          return res.json(req.student);
        });
    })(req, res, next);
  });

  // GET /api/sessions/current
  // This route checks whether the user is logged in or not.
  app.get('/api/sessions/current', (req, res) => {
    if(req.isAuthenticated()) {
      res.status(200).json(req.user);}
    else
      res.status(401).json({error: 'Not authenticated'});
  });

  // DELETE /api/session/current
  // This route is used for loggin out the current user.
  app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
      res.end();
    });
  });

// POST /api/student
app.post("/api/student", async (req, res) => {
  try{
    const result = await addStudent(req.body.Matricola, req.body.Name, req.body.LastName, req.body.Email, req.body.Password);
    if(result.error){
      res.status(400).json(result);
    }
    else {
      res.status(201).json(result);
    }
  }catch(error){
    res.status(500).json({error: "Internal Server Error"});
  }
});

// GET /api/courses
app.get("/api/courses", async (req, res) => {
  try{
    const courses = await getCourses();
    if(courses.error){
      res.status(400).json(courses);
    }
    else {
      res.status(200).json(courses);
    }
  }catch(error){
    res.status(500).json({error: "Internal Server Error"});
  }
});

// GET /api/plan
app.get("/api/plan", isLoggedIn, async (req, res) => {
  try{
    const studyPlan = await getStudyPlanByStudentID(req.user.Matricola);
    if(studyPlan.error){
      res.status(400).json(studyPlan);
    }
    else {
      res.status(200).json(studyPlan);
    }
  }
  catch(error){
    res.status(500).json({error: "Internal Server Error"});
  }
});

// POST /api/plan
app.post("/api/plan", isLoggedIn, async (req, res) => {
  try{
    const { typeofPlan, CourseCodes } = req.body;
    const result = await addStudyPlan(req.user.Matricola, typeofPlan, CourseCodes);
    if(result.error){
      res.status(400).json(result);
    }
    else {
      res.status(201).json(result);
    }
  }
  catch(error){
    res.status(500).json({error: "Internal Server Error"});
  }
});

// PUT /api/plan
app.put("/api/plan", isLoggedIn, async (req, res) => {
  try{
    const { CourseCodes, typeofPlan } = req.body;
    const result = await updateStudyPlan(req.user.Matricola, CourseCodes, typeofPlan);
    if(result.error){
      res.status(400).json(result);
    }
    else {
      res.status(200).json(result);
    }
  }
  catch(error){
    res.status(500).json({error: "Internal Server Error"});
  }
});

// DELETE /api/plan
app.delete("/api/plan", isLoggedIn, async (req, res) => {
  try{
    const result = await deleteStudyPlan(req.user.Matricola);
    if(result.error){
      res.status(400).json(result);
    }
    else {
      res.status(200).json(result);
    }
  }
  catch(error){
    res.status(500).json({error: "Internal Server Error"});
  }
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});