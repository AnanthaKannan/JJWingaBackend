## JJ Brain wings

## Predefined data
1. add the admin in the admin 
2. idGen add the value 100

## URL
https://jjwingabackend.onrender.com

## Deployed - https://render.com/#


## Relook 
1. fcmTokens should be unique for update


## API documentation
### Get all the students for the admin
GET {{url}}/admin/students
GET {{url}}/admin/students?limit=15&page=1&search=sonia
GET {{url}}/admin/students?limit=15&page=1&level=2
{
    "success": true,
    "message": "Student list fetched successfully",
    "students": [
        {
            "_id": "6a1721e39b7d0c85483d8cfd",
            "vertical": false,
            "fcmTokens": [],
            "studentId": "JJ119",
            "name": "Mr. Sylvia Romaguera",
            "level": 1,
            "score": {
                "assigned": 0,
                "new": 0,
                "progress": 0,
                "completed": 0,
                "correct": 0,
                "wrong": 0,
                "timeTaken": 0
            }
        }
    ],
    "meta": {
        "total": 1,
        "page": 1,
        "limit": 15,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false
    }
}

### Add a student for the admin
POST {{url}}/admin/students
payload:
{
    "name": "Sree",
    "level": 1
}

Response:
{
    "success": true,
    "message": "Score fetched successfully",
}

## Update the student by id
PATCH {{url}}/admin/students/:id
payload:
{
    "vertical": true,
    "level": 2
}

Response:
{
    "success": true,
    "message": "Score fetched successfully",
}

### Change password for logged-in student/admin
PATCH {{url}}/change-password
payload:
{
    "oldPassword": "currentPassword",
    "newPassword": "newPassword",
    "confirmNewPassword": "newPassword"
}

Response:
{
    "success": true,
    "message": "Password updated successfully"
}

### Reset student password by admin
POST {{url}}/admin/students/:id/reset-password

Response:
{
    "success": true,
    "message": "Student password reset successfully",
    "data": {
        "studentId": "JJ101",
        "name": "Sree",
        "password": "Welcome101"
    }
}

## Get the score of the student by id it is use for student dashboard
GET {{url}}/scores/6a1721e39b7d0c85483d8cfd
Response
{
    "success": true,
    "message": "Score fetched successfully",
    "_id": "6a1721e39b7d0c85483d8cff",
    "assigned": 0,
    "new": 0,
    "progress": 0,
    "completed": 0,
    "correct": 0,
    "wrong": 0,
    "timeTaken": 0,
    "practiceAssigned": 0,
    "practiceNew": 0,
    "practiceProgress": 0,
    "practiceCompleted": 0,
    "practiceCorrect": 0,
    "practiceWrong": 0,
    "practiceTimeTaken": 0
}

## Get monthly ranking
GET {{url}}/ranking
GET {{url}}/ranking?level=2

Response
{
    "success": true,
    "message": "Ranking list fetched successfully for level 2",
    "data": [
        {
            "rank": 1,
            "studentId": "6a1721e39b7d0c85483d8cfd",
            "name": "Sree",
            "studentCode": "JJ119",
            "level": 2,
            "totalCorrect": 10,
            "totalQuestions": 12,
            "accuracy": 83.33,
            "totalTimer": 300,
            "completedCount": 2
        }
    ]
}

## Add question by admin
POST {{url}}/admin/questions
payload:
{
    "questionId": "5A-01",
    "level": 1,
    "type": "practice",
    "questions": [
        "1+20+10",
        "10+10+10",
    ]
}

Response:
{
    "success": true,
    "message": "Question added successfully"
}

## Get the questions for admin
GET {{url}}/admin/questions
{{url}}/admin/questions?search=w&limit=15&page=1
{{url}}/admin/questions?type=practice&limit=15&page=1

Response:
{
    "success": true,
    "message": "Question list fetched successfully",
    "questions": [
        {
            "questions": [ "1+20+10", "10+10+10" ],
            "questionId": "Clayton Zemlak",
            "_id": "6a172d46aec0f68a802e2857",
        },
        {
            "questions": [ "10+10+10" ],
            "questionId": "Mr. Anthony Lemke",
            "_id": "6a172d782a3fe12b04e53ba1",
        }
    ],
    "meta": {
        "total": 2,
        "page": 1,
        "limit": 15,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false
    }
}

## Get practice questions for student
GET {{url}}/student/questions/practice
GET {{url}}/student/questions/practice?search=5A&limit=15&page=1
GET {{url}}/student/questions/practice?level=2&limit=15&page=1
Already assigned practice questions are excluded for the logged-in student.

Response:
{
    "success": true,
    "message": "Practice questions fetched successfully",
    "questions": [
        {
            "_id": "6a172d46aec0f68a802e2857",
            "questionId": "5A-01",
            "level": 2,
            "type": "practice",
            "questions": [ "1+20+10", "10+10+10" ],
            "marks": [],
            "oral": false,
            "isDeleted": false
        }
    ],
    "meta": {
        "total": 1,
        "page": 1,
        "limit": 15,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false
    }
}

## Student assign practice questions to self
POST {{url}}/student/questions/practice/assign
Payload:
{
    "questionIds": ["6a172d46aec0f68a802e2857"]
}

Response:
{
    "success": true,
    "message": "1 practice question(s) assigned successfully",
    "homeworks": [
        {
            "questionId": "6a172d46aec0f68a802e2857",
            "state": "NEW"
        }
    ],
    "skippedQuestionIds": [],
    "score": {
        "assigned": 0,
        "new": 0,
        "progress": 0,
        "completed": 0,
        "practiceAssigned": 1,
        "practiceNew": 1,
        "practiceProgress": 0,
        "practiceCompleted": 0
    }
}

## Student unassign practice questions from self
DELETE {{url}}/student/questions/practice/assign
Payload:
{
    "questionIds": ["6a172d46aec0f68a802e2857"]
}

Only assigned practice questions in `NEW` state can be unassigned. Practice questions in `PROGRESS` or `COMPLETED` state cannot be unassigned.

Response:
{
    "success": true,
    "message": "1 practice question(s) unassigned successfully",
    "unassignedQuestionIds": ["6a172d46aec0f68a802e2857"],
    "deletedCount": 1,
    "score": {
        "assigned": 0,
        "new": 0,
        "progress": 0,
        "completed": 0,
        "practiceAssigned": 0,
        "practiceNew": 0,
        "practiceProgress": 0,
        "practiceCompleted": 0
    }
}

## assign homework to the student
POST {{url}}/admin/questions/assign
Payload with a student:
{
    "studentId":"6a1726e84273750610292d45" ,
    "questionIds": ["6a172d782a3fe12b04e53ba1"]
}

Payload with levels:
{
    "levels": [1, 2],
    "questionIds": ["6a172d782a3fe12b04e53ba1"]
}

Already assigned student/question pairs are skipped. Notifications are sent only to students who receive newly assigned homework or exam questions. Assignment notification bodies include the assigned question IDs, for example: `You have new homework assigned: 5A-01, 5A-02.`

Response:
{
    "success": true,
    "message": "Homework question(s) assigned successfully",
    "assignedCount": 1,
    "skippedCount": 1,
    "students": [
        {
            "id": "6a1726e84273750610292d45",
            "studentId": "JJ101",
            "name": "Student A",
            "level": 1,
            "assignedQuestionIds": ["6a172d782a3fe12b04e53ba1"],
            "assignedQuestions": [
                {
                    "id": "6a172d782a3fe12b04e53ba1",
                    "questionId": "5A-01",
                    "type": "homework"
                }
            ],
            "skippedQuestionIds": ["6a172d782a3fe12b04e53ba2"],
            "skippedQuestions": [
                {
                    "id": "6a172d782a3fe12b04e53ba2",
                    "questionId": "5A-02",
                    "type": "homework"
                }
            ]
        }
    ],
    "notifications": {
        "sentCount": 1,
        "totalRequested": 1
    }
}

## unassign homework from the student
DELETE {{url}}/admin/questions/assign
Payload:
{
    "studentId":"6a1726e84273750610292d45" ,
    "questionIds": ["6a172d782a3fe12b04e53ba1"]
}

Response:
{
    "success": true,
    "message": "1 homework question(s) unassigned successfully",
    "unassignedQuestionIds": ["6a172d782a3fe12b04e53ba1"]
}

## Delete question by id
DELETE {{url}}/admin/questions/:id

If the question is assigned to any student, it will be soft deleted by setting `isDeleted` to `true`.
If the question is not assigned to any student, it will be deleted from the database.

Response:
{
    "success": true,
    "message": "Question soft deleted successfully",
    "deleteType": "soft"
}


## Questions available for the student, which all are already assigned the list will not come
GET {{url}}/admin/questions/available/:studentId
GET {{url}}/admin/questions/available/:studentId?search=w&limit=15&page=1
GET {{url}}/admin/questions/available/:studentId?type=practice&limit=15&page=1
Response:
{
    "success": true,
    "message": "Available questions fetched successfully",
    "questions": [
        {
            "_id": "6a172e059e432d90689c7b41",
            "questions": [
                "1+20+10",
                "10+10+10"
            ],
            "questionId": "Ms. Neil Graham"
        },
        {
            "_id": "6a172e079e432d90689c7b44",
            "questions": [
                "1+20+10",
                "10+10+10"
            ],
            "questionId": "Dixie Torphy"
        }
    ],
    "meta": {
        "total": 2,
        "page": 1,
        "limit": 15,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false
    }
}

## get homework for student
{{url}}/homework/:studentId/:state // state can be "NEW", "PROGRESS", "COMPLETED"
{{url}}/homework/:studentId/:state?limit=15&page=1
Response:
{
    "success": true,
    "message": "Homework list fetched successfully",
    "homeworks": [
        {
            "results": [],
            "answers": [],
            "state": "NEW",
            "timer": 0,
            "_id": "6a1730ba96ec599380ac7074",
            "studentId": "6a1726e84273750610292d45",
            "questionId": {
                "questions": [
                    "1+20+10",
                    "10+10+10"
                ],
                "_id": "6a172d46aec0f68a802e2857",
                "questionId": "Clayton Zemlak",
                "__v": 0
            },
            "__v": 0
        },
        {
            "results": [],
            "answers": [],
            "state": "NEW",
            "timer": 0,
            "_id": "6a17312696ec599380ac707d",
            "studentId": "6a1726e84273750610292d45",
            "questionId": {
                "questions": [
                    "1+20+10",
                    "10+10+10"
                ],
                "_id": "6a172d782a3fe12b04e53ba1",
                "questionId": "Adam Ruecker",
                "__v": 0
            },
            "__v": 0
        }
    ],
    "meta": {
        "total": 2,
        "page": 1,
        "limit": 15,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false
    }
}

## Get homework by id
GET {{url}}/homework/id
Response:
{
    "success": true,
    "message": "Homework fetched successfully",
    "homework": {
        "results": [],
        "answers": [],
        "state": "NEW",
        "timer": 0,
        "_id": "6a1730ba96ec599380ac7074",
        "studentId": "6a1726e84273750610292d45",
        "questionId": {
            "questions": [
                "1+20+10",
                "10+10+10"
            ],
            "_id": "6a172d46aec0f68a802e2857",
            "questionId": "Clayton Zemlak",
            "__v": 0
        },
        "__v": 0
    }
}

## Update homework by id
PATCH {{url}}/homework/id // note whenever we update the homework it will update the score as well
Payload:
{
    "state": "PROGRESS",
    "timer": 30,
    "answers": [ "30", "30" ],
    "results": [ true, true ]
}
Response:
{
    "success": true,
    "message": "Homework updated successfully"
}
