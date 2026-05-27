const service = require('../service')

const login = async (req, res) => {
  const { username, password } = req.body;
  const result = await service.login(username, password);
}

const getStudentList = async (req, res) => {
  const { page, limit } = req.query;
  const result = await service.getStudentList(Number(page), Number(limit));
}

const loginx = async (req, res) => {
}