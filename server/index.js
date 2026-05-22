// imports
import express from "express";
import morgan from "morgan";
import cors from "cors";
import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import { addStudent, getCourses, getStudentsByEmail, getStudyPlanByStudentID, getStudent } from "./dao.js";

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

// GET / student by email
app.get("/student", async (req, res) => {
  try{
    const students = await getStudentsByEmail(req.query.email);
    if(students.error){
      res.status(400).json(students);
    }
    else {
      res.status(200).json(students);
    }
  }catch(error){
    res.status(500).json({error: "Internal Server Error"});
  }
});

// POST / Student
app.post("/student", async (req, res) => {
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

// GET / courses
app.get("/courses", async (req, res) => {
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

// GET / study plan by student ID
app.get("/studyplan", async (req, res) => {
  try{
    const studyPlan = await getStudyPlanByStudentID(req.query.studentID);
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

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});