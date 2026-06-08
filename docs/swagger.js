/**
 * @openapi
 * components:
 *   securitySchemes:
 *     AccessToken:
 *       type: apiKey
 *       in: header
 *       name: x-access-token
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *     LoginResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/SuccessResponse'
 *         - type: object
 *           properties:
 *             token:
 *               type: string
 *             role:
 *               type: string
 *               enum: [admin, student]
 *             user:
 *               type: object
 *     StudentInput:
 *       type: object
 *       required: [name, level]
 *       properties:
 *         name:
 *           type: string
 *         level:
 *           type: number
 *     StudentUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         password:
 *           type: string
 *         vertical:
 *           type: boolean
 *         deviceId:
 *           type: string
 *         level:
 *           type: number
 *     QuestionInput:
 *       type: object
 *       required: [questionId, level, questions]
 *       properties:
 *         questionId:
 *           type: string
 *         level:
 *           type: number
 *         questions:
 *           type: array
 *           items:
 *             type: object
 *     QuestionUpdateInput:
 *       type: object
 *       properties:
 *         questionId:
 *           type: string
 *         level:
 *           type: number
 *     HomeworkUpdateInput:
 *       type: object
 *       properties:
 *         state:
 *           type: string
 *           enum: [NEW, PROGRESS, COMPLETED]
 *         answers:
 *           type: array
 *           items: {}
 *         results:
 *           type: array
 *           items:
 *             type: boolean
 *         timer:
 *           type: number
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *         page:
 *           type: number
 *         limit:
 *           type: number
 *         totalPages:
 *           type: number
 *         hasNextPage:
 *           type: boolean
 *         hasPrevPage:
 *           type: boolean
 *
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Server is running
 *
 * /login:
 *   post:
 *     summary: Login as admin or student
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *
 * /login/{studentId}:
 *   post:
 *     summary: Login student using an existing device id from token
 *     tags: [Auth]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 *
 * /admin/students:
 *   get:
 *     summary: List students created by the logged-in admin
 *     tags: [Students]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student list fetched successfully
 *   post:
 *     summary: Create a student
 *     tags: [Students]
 *     security:
 *       - AccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       201:
 *         description: Student added successfully
 *
 * /admin/students/{id}:
 *   patch:
 *     summary: Update a student
 *     tags: [Students]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentUpdateInput'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *
 * /student:
 *   patch:
 *     summary: Update the logged-in student
 *     tags: [Students]
 *     security:
 *       - AccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentUpdateInput'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *
 * /student/device-id:
 *   delete:
 *     summary: Remove a student device id
 *     tags: [Students]
 *     security:
 *       - AccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, deviceId]
 *             properties:
 *               studentId:
 *                 type: string
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device ID removed successfully
 *
 * /student/same-device:
 *   get:
 *     summary: List students sharing the logged-in student's device ids
 *     tags: [Students]
 *     security:
 *       - AccessToken: []
 *     responses:
 *       200:
 *         description: Students fetched successfully
 *
 * /ranking:
 *   get:
 *     summary: Weekly ranking scoped by related admin
 *     tags: [Ranking]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Ranking list fetched successfully
 *
 * /admin/questions:
 *   get:
 *     summary: List questions
 *     tags: [Questions]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Question list fetched successfully
 *   post:
 *     summary: Create a question
 *     tags: [Questions]
 *     security:
 *       - AccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionInput'
 *     responses:
 *       201:
 *         description: Question added successfully
 *
 * /admin/questions/{id}:
 *   patch:
 *     summary: Update a question
 *     tags: [Questions]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionUpdateInput'
 *     responses:
 *       200:
 *         description: Question updated successfully
 *   delete:
 *     summary: Delete or soft-delete a question
 *     tags: [Questions]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *
 * /admin/questions/assign:
 *   post:
 *     summary: Assign questions to a student
 *     tags: [Questions]
 *     security:
 *       - AccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, questionIds]
 *             properties:
 *               studentId:
 *                 type: string
 *               questionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Questions assigned successfully
 *
 * /admin/questions/available/{studentId}:
 *   get:
 *     summary: List questions available for a student
 *     tags: [Questions]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Available questions fetched successfully
 *
 * /homework/{studentId}/{state}:
 *   get:
 *     summary: List homework for a student and state
 *     tags: [Homework]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NEW, PROGRESS, COMPLETED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Homework list fetched successfully
 *
 * /homework/{id}:
 *   get:
 *     summary: Get homework by id
 *     tags: [Homework]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Homework fetched successfully
 *   patch:
 *     summary: Update homework
 *     tags: [Homework]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HomeworkUpdateInput'
 *     responses:
 *       200:
 *         description: Homework updated successfully
 *
 * /scores/{studentId}:
 *   get:
 *     summary: Get score by student id
 *     tags: [Scores]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Score fetched successfully
 *
 * /fcm-token:
 *   patch:
 *     summary: Update FCM token
 *     tags: [Notifications]
 *     security:
 *       - AccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fcmToken]
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token updated successfully
 *
 * /student/fcm-token:
 *   patch:
 *     deprecated: true
 *     summary: Update FCM token
 *     tags: [Notifications]
 *     security:
 *       - AccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fcmToken]
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token updated successfully
 *
 * /notifications/{studentId}:
 *   get:
 *     summary: List notifications for a student
 *     tags: [Notifications]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *
 * /admin/notifications:
 *   get:
 *     summary: List admin notifications
 *     tags: [Notifications]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *   post:
 *     summary: Send bulk notifications to students
 *     tags: [Notifications]
 *     security:
 *       - AccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentIds, messageHeader, messageBody]
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *               messageHeader:
 *                 type: string
 *               messageBody:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification sent
 *
 * /uploads:
 *   post:
 *     summary: Upload an image or PDF
 *     tags: [Uploads]
 *     security:
 *       - AccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, path]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               path:
 *                 type: string
 *                 description: profile, practice, celebration, or another folder path
 *               name:
 *                 type: string
 *                 description: Required for practice and celebration uploads
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *
 * /profile-pic:
 *   delete:
 *     summary: Delete the logged-in user's profile picture
 *     tags: [Uploads]
 *     security:
 *       - AccessToken: []
 *     responses:
 *       200:
 *         description: Profile picture deleted successfully
 *
 * /admin/file-uploads:
 *   get:
 *     summary: List FileUpload records by type
 *     tags: [Uploads]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [practice, celebration]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *     responses:
 *       200:
 *         description: File upload list fetched successfully
 *       400:
 *         description: Invalid file upload type
 *
 * /admin/file-uploads/{id}:
 *   patch:
 *     summary: Update a FileUpload name
 *     tags: [Uploads]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: File upload name updated successfully
 *   delete:
 *     summary: Delete a FileUpload and its Supabase file
 *     tags: [Uploads]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File upload deleted successfully
 *
 * /admin/file-uploads/{id}/download:
 *   get:
 *     summary: Download a FileUpload file
 *     tags: [Uploads]
 *     security:
 *       - AccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
