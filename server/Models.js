import dayjs from 'dayjs';

export function Student(Matricola, Name, LastName, Email, hashedPassword, Salt, PlanType = null){
    this.Matricola = Matricola;
    this.Name = Name;
    this.Surname = LastName;
    this.Email = Email;
    this.hashedPassword = hashedPassword;
    this.Salt = Salt;
    this.PlanType = PlanType;  
}

export function Course(Code, Name, Credits, MaxStudents = 0, PreparatoryCourse = 0, Incompatibilities = [], StudentsEnrolled = 0){
    this.Code = Code;
    this.Name = Name;
    this.Credits = Credits;
    this.MaxStudents = MaxStudents;
    this.PreparatoryCourse = PreparatoryCourse;
    this.Incompatibilities = Incompatibilities;
    this.StudentsEnrolled = StudentsEnrolled;
}

export function StudyPlan(StudentID, CourseCode){
    this.StudentID = StudentID;
    this.CourseCode = CourseCode;
}