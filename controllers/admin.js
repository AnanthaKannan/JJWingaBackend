const { Admin } = require("../model/admin");


exports.addAdmin = async(req, res) => {
    const body = req.body;
    const admin = new Admin(body);
    await admin.save();
    return res.status(200).json({
        status: 200,
        message: "Admin successfully added.."
    });
}

exports.getAdmin = async(req, res) => {
    const data = await Admin.find({});
    return res.status(200).json({
        status: 200,
        message: "Data suessfully fetched",
        data
    });
}

exports.getAdminByMail = async(req, res) => {
    const {email} = req.query;
    const data = await Admin.findOne({ email });
    return res.status(200).json({
        status: 200,
        message: "Data suessfully fetched...",
        data
    });
}

exports.updateAdminByMail = async(req, res) =>{
    const {old_email, new_email} = req.params;
    const data = await Admin.updateMany({email:old_email}, { $set: { email: new_email } } );
    console.log("data", data);
    return res.status(200).json({
        status: 200,
        message: "Successfully updated",
        updated_count: data.n
    });
}

exports.checkPut = (req, res) => {
    return res.status(200).json({
        status: 200,
        message: "Api called successfully..",
        data: []
    });
}

exports.deletAdminById = async(req, res) => {
    const {_id} = req.params; //assume get 54fcb3890cba9c4234f5c925
    const data = await Admin.deleteOne({ _id });
    console.log(data)
    return res.status(200).json({
        status: 200,
        message: "Successfully Deleted",
        deletedCount: data.deletedCount
    });
}
