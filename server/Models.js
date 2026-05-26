import dayjs from 'dayjs';

export function Student(Matricola, Name, LastName, Email, PlanType){
    this.Matricola = Matricola;
    this.Name = Name;
    this.Surname = LastName;
    this.Email = Email;
    this.PlanType = PlanType;  
}

export function Course(Code, Name, Credits, MaxStudents, PreparatoryCourse, StudentsEnrolled){
    this.Code = Code;
    this.Name = Name;
    this.Credits = Credits;
    this.MaxStudents = MaxStudents;
    this.PreparatoryCourse = PreparatoryCourse;
    this.Incompatibilities = []
    this.StudentsEnrolled = StudentsEnrolled === undefined ? 0 : StudentsEnrolled;
}