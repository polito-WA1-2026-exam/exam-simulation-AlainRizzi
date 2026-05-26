# Exam #N: "Exam Title"
## Student: s123456 LASTNAME FIRSTNAME 

## React Client Application Routes

- Route `/`: page content and purpose
- Route `/something/:param`: page content and purpose, param specification
- ...

## API Server

- POST `/api/sessions`
  - request body: `{email: string, password: string}`
  - response: student object with Matricola, username, Name on success; error message on failure

- GET `/api/sessions/current`
  - request parameters: none
  - response: current logged-in user object, or 401 error if not authenticated

- DELETE `/api/sessions/current`
  - request parameters: none
  - response: empty response on successful logout

- POST `/api/student`
  - request body: `{Matricola: string, Name: string, LastName: string, Email: string, Password: string}`
  - response: success message or error

- GET `/api/courses`
  - request parameters: none
  - response: array of course objects with Code, Name, Credits, MaxStudents, PreparatoryCourse, Incompatibilities, StudentsEnrolled

- GET `/api/plan`
  - requires authentication
  - request parameters: none
  - response: array of study plan objects for current logged-in student

- POST `/api/plan`
  - requires authentication
  - request body: `{typeofPlan: string, CourseCodes: string[]}`
  - response: success message or error

- PUT `/api/plan`
  - requires authentication
  - request body: `{StudentMatricola: string, CourseCodes: string[]}`
  - response: success message or error

- DELETE `/api/plan`
  - requires authentication
  - request parameters: none
  - response: success message or error

## Database Tables

- Table `Student` - contains Matricola, Name, Surname, Email, HashedPassword, Salt, PlanType
- Table `Course` - contains Code, Name, Credits, MaxStudents, PreparatoryCourse
- Table `Incompatibility` - contains CourseCode1, CourseCode2
- Table `StudyPlan` - contains StudentID, CourseCode

## Main React Components

- `ListOfSomething` (in `List.js`): component purpose and main functionality
- `GreatButton` (in `GreatButton.js`): component purpose and main functionality
- ...

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- username, password (plus any other requested info)
- username, password (plus any other requested info)

## Use of AI Tools
Briefly describe whether you used any AI tools (e.g., ChatGPT, GitHub Copilot, Claude) while working on this project, for which purposes (e.g., clarifying concepts, debugging, generating code), and how you verified or adapted their output.
If you did not use any AI tools, simply state so.
