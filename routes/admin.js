const express = require("express");
const router = express.Router();

const controller = require('../controllers')


router.post('/login', controller.login);

router.post('/student', controller.addAdmin);

router.get('/student', controller.getAdmin);

router.get('/student:id', controller.getAdminByMail);

router.put('/updateAdminByMail/:old_email/:new_email', controller.updateAdminByMail)

router.delete('/deletAdminById/:_id', controller.deletAdminById)

module.exports = router;
