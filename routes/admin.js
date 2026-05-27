const express = require("express");
const router = express.Router();
const AdminController = require('../controllers/admin');


router.post('/student', AdminController.addAdmin);

router.get('/student', AdminController.getAdmin);

router.get('/student:id', AdminController.getAdminByMail);

router.put('/updateAdminByMail/:old_email/:new_email', AdminController.updateAdminByMail)

router.delete('/deletAdminById/:_id', AdminController.deletAdminById)

module.exports = router;
