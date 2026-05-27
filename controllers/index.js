const service = require('../service')

const login = async (req, res) => {
  const { username, password } = req.body;
  const result = await service.login(username, password);
}

const getStudentList = async (req, res) => {
  const { page, limit } = req.query;
  const result = await service.getStudentList(Number(page), Number(limit));
}

const getQuestionList = async (req, res) => {
  const { page, limit } = req.query;
  const result = await service.getQuestionList(Number(page), Number(limit));
}

const getHomeworkList = async (req, res) => {
  const { state, page, limit } = req.query;
  const result = await service.getHomeworkList(req.user.id, state, Number(page), Number(limit));
}

const getAvailableQuestionsForStudent = async (req, res) => {
  const { studentId } = req.params;
  const { page, limit } = req.query;
  const result = await service.getAvailableQuestionsForStudent(studentId, Number(page), Number(limit));
}

const getScoreByStudentId = async (req, res) => {
  const result = await service.getScoreByStudentId(req.user.id);
}

const loginx = async (req, res) => {
}
const loginx = async (req, res) => {
}
const loginx = async (req, res) => {
}
const loginx = async (req, res) => {
}
const loginx = async (req, res) => {
}