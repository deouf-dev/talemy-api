import db from "../../models/index.js";
const { Subjects } = db;

export async function getAllSubjects() {
  const subjects = await Subjects.findAll({
    attributes: ["id", "name"],
    order: [["name", "ASC"]],
  });
  return subjects;
}
