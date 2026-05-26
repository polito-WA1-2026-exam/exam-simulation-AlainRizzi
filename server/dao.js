import sqlite from "sqlite3";
import { Student, Course } from "./Models.js";
import crypto from "crypto";

const db = new sqlite.Database("courses.sqlite", (err) => {
  if (err) throw err;
});


// DB functions
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
                const courses = rows.map(row => {
                    const course = new Course(row.Code, row.Name, row.Credits, row.MaxStudents, row.PreparatoryCourse, row.StudentsEnrolled);
                    course.Incompatibilities = row.Incompatibilities === '' ? [] : row.Incompatibilities.split(',');
                    return course;
                });
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
                const studyPlan = rows.map(row => ({StudentID: row.StudentID, CourseCode: row.CourseCode}));
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
        
        crypto.scrypt(password, row.Salt, 32, function(err, hashedPassword) {
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

// STUDY PLANS
export const addStudyPlan = (studentID, planType, courseCodes) => {
    return new Promise((resolve, reject) => {
        // First, delete existing study plan if any
        const deleteQuery = "DELETE FROM StudyPlan WHERE StudentID = ?";
        db.run(deleteQuery, [studentID], function(err) {
            if (err) {
                reject({error: "Database error"});
            } else {
                // Then insert new courses
                const insertQuery = "INSERT INTO StudyPlan (StudentID, CourseCode) VALUES (?, ?)";
                let completed = 0;
                let hasError = false;

                courseCodes.forEach(courseCode => {
                    db.run(insertQuery, [studentID, courseCode], function(err) {
                        if (err && !hasError) {
                            hasError = true;
                            reject({error: "Database error"});
                        } else {
                            completed++;
                            if (completed === courseCodes.length && !hasError) {
                                // Update student plan type
                                const updateQuery = "UPDATE Student SET PlanType = ? WHERE Matricola = ?";
                                db.run(updateQuery, [planType, studentID], function(err) {
                                    if (err) {
                                        reject({error: "Database error"});
                                    } else {
                                        resolve({message: "Study plan created successfully"});
                                    }
                                });
                            }
                        }
                    });
                });
            }
        });
    });
};

export const updateStudyPlan = (studentID, courseCodes, planType) => {
    return new Promise((resolve, reject) => {
        const deleteQuery = "DELETE FROM StudyPlan WHERE StudentID = ?";
        db.run(deleteQuery, [studentID], function(err) {
            if (err) {
                reject({error: "Database error"});
            } else {
                const insertQuery = "INSERT INTO StudyPlan (StudentID, CourseCode) VALUES (?, ?)";
                let completed = 0;
                let hasError = false;

                courseCodes.forEach(courseCode => {
                    db.run(insertQuery, [studentID, courseCode], function(err) {
                        if (err && !hasError) {
                            hasError = true;
                            reject({error: "Database error"});
                        } else {
                            completed++;
                            if (completed === courseCodes.length && !hasError) {
                                // Update plan type if provided
                                if (planType) {
                                    const updateQuery = "UPDATE Student SET PlanType = ? WHERE Matricola = ?";
                                    db.run(updateQuery, [planType, studentID], function(err) {
                                        if (err) {
                                            reject({error: "Database error"});
                                        } else {
                                            resolve({message: "Study plan updated successfully"});
                                        }
                                    });
                                } else {
                                    resolve({message: "Study plan updated successfully"});
                                }
                            }
                        }
                    });
                });
            }
        });
    });
};

export const deleteStudyPlan = (studentID) => {
    return new Promise((resolve, reject) => {
        const query = "DELETE FROM StudyPlan WHERE StudentID = ?";
        db.run(query, [studentID], function(err) {
            if (err) {
                reject({error: "Database error"});
            } else {
                // Also clear the plan type
                const updateQuery = "UPDATE Student SET PlanType = NULL WHERE Matricola = ?";
                db.run(updateQuery, [studentID], function(err) {
                    if (err) {
                        reject({error: "Database error"});
                    } else {
                        resolve({message: "Study plan deleted successfully"});
                    }
                });
            }
        });
    });
};

// VALIDATION FUNCTIONS
// Validate study plan against all constraints
export const validateStudyPlan = async (courseCodes, planType) => {
    try {
        // Get all courses with their details
        const courses = await getCourses();
        const selectedCourses = courses.filter(c => courseCodes.includes(c.Code));
        
        // Validate credit range
        const totalCredits = selectedCourses.reduce((sum, c) => sum + c.Credits, 0);
        const creditRange = planType === 'full-time' ? {min: 60, max: 80} : {min: 20, max: 40};
        
        if (totalCredits < creditRange.min || totalCredits > creditRange.max) {
            return {error: `Total credits must be between ${creditRange.min} and ${creditRange.max} for ${planType} plan. Current: ${totalCredits}`};
        }
        
        // Validate incompatibilities
        for (let i = 0; i < selectedCourses.length; i++) {
            for (let j = i + 1; j < selectedCourses.length; j++) {
                const course1 = selectedCourses[i];
                const course2 = selectedCourses[j];
                
                if (course1.Incompatibilities && course1.Incompatibilities.includes(course2.Code)) {
                    return {error: `Courses ${course1.Code} and ${course2.Code} are incompatible and cannot be selected together`};
                }
            }
        }
        
        // Validate preparatory courses
        for (const course of selectedCourses) {
            if (course.PreparatoryCourse) {
                if (!courseCodes.includes(course.PreparatoryCourse)) {
                    return {error: `Course ${course.Code} requires ${course.PreparatoryCourse} as a preparatory course`};
                }
            }
        }
        
        // Validate max students (only for new enrollments - check current count)
        for (const course of selectedCourses) {
            if (course.MaxStudents && course.StudentsEnrolled >= course.MaxStudents) {
                return {error: `Course ${course.Code} has reached maximum capacity`};
            }
        }
        
        return {valid: true};
    } catch (err) {
        return {error: "Validation error"};
    }
};

