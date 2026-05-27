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
    "name": "Sree"
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
    "vertical": true
}

Response:
{
    "success": true,
    "message": "Score fetched successfully",
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
    "timeTaken": 0
}

## Add question by admin
POST {{url}}/admin/questions
payload:
{
    "questionId": "5A-01",
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

## assign homework to the student
POST {{url}}/admin/questions/assign
Payload:
{
    "studentId":"6a1726e84273750610292d45" ,
    "questionId": "6a172d782a3fe12b04e53ba1" 
}

Response:
{
    "success": true,
    "message": "Homework assigned successfully"
}


## Questions available for the student, which all are already assigned the list will not come
GET {{url}}/admin/questions/available/:studentId
GET {{url}}/admin/questions/available/:studentId?search=w&limit=15&page=1
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