const express = require("express");
const router = express.Router();
const AdminController = require('../controllers/admin');


router.post('/addAdmin', AdminController.addAdmin);

router.get('/getAdmin', AdminController.getAdmin);

router.get('/getAdminByMail', AdminController.getAdminByMail);

router.put('/updateAdminByMail/:old_email/:new_email', AdminController.updateAdminByMail)

router.delete('/deletAdminById/:_id', AdminController.deletAdminById)

module.exports = router;
