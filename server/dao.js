import sqlite from "sqlite3";
import { Student, StudyPlan, Course } from "./Models.js";
import crypto from "crypto";

const db = new sqlite.Database("courses.sqlite", (err) => {
  if (err) throw err;
});


// DB functions
// STUDENTS
export const getStudentsByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM Student WHERE Email = ?";
        db.get(query, [email], (err, row) => {
            if (err) {
                reject({error: "Database error"});
            } else if (!row) {
                resolve({error: "Student not found"});
            } else {
                resolve(new Student(row.Matricola, row.Name, row.Surname, row.Email, row.HashedPassword, row.Salt, row.PlanType));
            }
        });
    });
};

// COURSES
export const getCourses = () => {
    return new Promise((resolve, reject) => {
        const query = `SELECT c.Code, c.Name, c.Credits, c.MaxStudents, c.PreparatoryCourse,
            COALESCE(
                    GROUP_CONCAT(
                        DISTINCT CASE
                            WHEN i.CourseCode1 = c.Code THEN i.CourseCode2
                            WHEN i.CourseCode2 = c.Code THEN i.CourseCode1
                        END
                    ),
                    ''
                ) AS Incompatibilities,
                COUNT(DISTINCT sp.StudentID) AS StudentsEnrolled
            FROM Course c
            LEFT JOIN Incompatibility i
                ON c.Code = i.CourseCode1
                OR c.Code = i.CourseCode2
            LEFT JOIN StudyPlan sp
                ON sp.CourseCode = c.Code
            GROUP BY 
                c.Code,
                c.Name,
                c.Credits,
                c.MaxStudents,
                c.PreparatoryCourse
            `;
        db.all(query, [], (err, rows) => {
            if (err) {
                reject({error: "Database error"});
            } else {
                const courses = rows.map(row => new Course(row.Code, row.Name, row.Credits, row.MaxStudents, row.PreparatoryCourse, row.Incompatibilities === '' ? [] : row.Incompatibilities.split(','), row.StudentsEnrolled));

                resolve(courses);
            }
        });
    });
};

// GET / study plan by student ID  
export const getStudyPlanByStudentID = (studentID) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM StudyPlan WHERE StudentID = ?";
        db.all(query, [studentID], (err, rows) => {
            if (err) {
                reject({error: "Database error"});
            } else {
                const studyPlan = rows.map(row => new StudyPlan(row.StudentID, row.CourseCode));
                resolve(studyPlan);
            }
        });
    });
};

/* Students */
export const getStudent = (email, password) => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM Student WHERE Email = ?";
    db.get(query, [email], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve(false); 
      }
      else {
        const student = {Matricola: row.Matricola, username: row.Email, Name: row.Name};
        
        crypto.scrypt(password, row.Salt, 16, function(err, hashedPassword) {
          if (err) reject(err);
          if(!crypto.timingSafeEqual(Buffer.from(row.hashedPassword, "hex"), hashedPassword))
            resolve(false);
          else
            resolve(student);
        });
      }
    });
  });
};

export const addStudent = (Matricola, Name, LastName, Email, Password) => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(Password, salt, 16, function(err, hashedPassword) {
            if (err) reject(err);
            const query = "INSERT INTO Student (Matricola, Name, LastName, HashedPassword, Email, Salt) VALUES (?, ?, ?, ?, ?, ?)";
            db.run(query, [Matricola, Name, LastName, hashedPassword.toString('hex'), Email, salt], function(err) {
                if (err) {
                    reject({error: "Database error"});
                } else {
                    resolve({message: "Student added successfully"});
                }
            });
        });
    });
};

