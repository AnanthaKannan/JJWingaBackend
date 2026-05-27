## JJ Brain wings

## Predefined data
1. add the admin in the admin 
2. idGen add the value 100

## URL
https://jjwingabackend.onrender.com


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
            "questionId": "Clayton Zemlak"
        },
        {
            "questions": [ "10+10+10" ],
            "questionId": "Mr. Anthony Lemke"
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
