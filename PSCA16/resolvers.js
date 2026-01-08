const sql = require('mssql');
const dbConfig = require('./dbconfig');

async function executeQuery(query, params = []) {
  const pool = await sql.connect(dbConfig);
  const request = pool.request();
  params.forEach(param => {
    request.input(param.name, param.type, param.value);
  });
  const result = await request.query(query);
  await pool.close();
  return result.recordset;
}

function mapKeysToSchema(rows, schemaMapping = {}) {
  return rows.map(row => {
    const mapped = {};
    for (const key in row) {
      const mappedKey = schemaMapping[key.toLowerCase()] || key.toLowerCase();
      mapped[mappedKey] = row[key];
    }
    return mapped;
  });
}

const fieldMappings = {
  faculty: {
    'faculty': 'faculty',
    'faculty_name': 'faculty_name'
  },
  teacher: {
    'teacher': 'teacher',
    'teacher_name': 'teacher_name',
    'pulpit': 'pulpit'
  },
  pulpit: {
    'pulpit': 'pulpit',
    'pulpit_name': 'pulpit_name',
    'faculty': 'faculty'
  },
  subject: {
    'subject': 'subject',
    'subject_name': 'subject_name',
    'pulpit': 'pulpit'
  }
};

const resolvers = {
  getFaculties: async ({ faculty }) => {
    let query = 'SELECT * FROM FACULTY';
    const params = [];
    if (faculty) {
      query += ' WHERE FACULTY = @faculty';
      params.push({ name: 'faculty', type: sql.NVarChar, value: faculty });
    }
    const rows = await executeQuery(query, params);
    return mapKeysToSchema(rows, fieldMappings.faculty);
  },

  getTeachers: async ({ teacher }) => {
    let query = 'SELECT * FROM TEACHER';
    const params = [];
    if (teacher) {
      query += ' WHERE TEACHER = @teacher';
      params.push({ name: 'teacher', type: sql.NVarChar, value: teacher });
    }
    const rows = await executeQuery(query, params);
    return mapKeysToSchema(rows, fieldMappings.teacher);
  },

  getPulpits: async ({ pulpit }) => {
    let query = 'SELECT * FROM PULPIT';
    const params = [];
    if (pulpit) {
      query += ' WHERE PULPIT = @pulpit';
      params.push({ name: 'pulpit', type: sql.NVarChar, value: pulpit });
    }
    const rows = await executeQuery(query, params);
    return mapKeysToSchema(rows, fieldMappings.pulpit);
  },

  getSubjects: async ({ subject }) => {
    let query = 'SELECT * FROM SUBJECT';
    const params = [];
    if (subject) {
      query += ' WHERE SUBJECT = @subject';
      params.push({ name: 'subject', type: sql.NVarChar, value: subject });
    }
    const rows = await executeQuery(query, params);
    return mapKeysToSchema(rows, fieldMappings.subject);
  },

  getTeachersByFaculty: async ({ faculty }) => {
    const query = `
      SELECT T.* FROM TEACHER T
      INNER JOIN PULPIT P ON T.PULPIT = P.PULPIT
      WHERE P.FACULTY = @faculty
    `;
    const params = [{ name: 'faculty', type: sql.NVarChar, value: faculty }];
    const rows = await executeQuery(query, params);
    return mapKeysToSchema(rows, fieldMappings.teacher);
  },

  getSubjectsByFaculties: async ({ faculty }) => {
    const query = `
      SELECT S.* FROM SUBJECT S
      INNER JOIN PULPIT P ON S.PULPIT = P.PULPIT
      WHERE P.FACULTY = @faculty
    `;
    const params = [{ name: 'faculty', type: sql.NVarChar, value: faculty }];
    const rows = await executeQuery(query, params);
    return mapKeysToSchema(rows, fieldMappings.subject);
  },

  // MUTATIONS
  setFaculty: async ({ faculty }) => {
    const checkQuery = 'SELECT * FROM FACULTY WHERE FACULTY = @faculty';
    const checkParams = [{ name: 'faculty', type: sql.NVarChar, value: faculty.faculty }];
    const exists = await executeQuery(checkQuery, checkParams);

    if (exists.length > 0) {
      const updateQuery = `
        UPDATE FACULTY SET FACULTY_NAME = @faculty_name
        WHERE FACULTY = @faculty
      `;
      const updateParams = [
        { name: 'faculty', type: sql.NVarChar, value: faculty.faculty },
        { name: 'faculty_name', type: sql.NVarChar, value: faculty.faculty_name }
      ];
      await executeQuery(updateQuery, updateParams);
    } else {
      const insertQuery = `
        INSERT INTO FACULTY (FACULTY, FACULTY_NAME)
        VALUES (@faculty, @faculty_name)
      `;
      const insertParams = [
        { name: 'faculty', type: sql.NVarChar, value: faculty.faculty },
        { name: 'faculty_name', type: sql.NVarChar, value: faculty.faculty_name }
      ];
      await executeQuery(insertQuery, insertParams);
    }
    return faculty;
  },

  setTeacher: async ({ teacher }) => {
    const checkQuery = 'SELECT * FROM TEACHER WHERE TEACHER = @teacher';
    const checkParams = [{ name: 'teacher', type: sql.NVarChar, value: teacher.teacher }];
    const exists = await executeQuery(checkQuery, checkParams);

    if (exists.length > 0) {
      const updateQuery = `
        UPDATE TEACHER SET TEACHER_NAME = @teacher_name, PULPIT = @pulpit
        WHERE TEACHER = @teacher
      `;
      const updateParams = [
        { name: 'teacher', type: sql.NVarChar, value: teacher.teacher },
        { name: 'teacher_name', type: sql.NVarChar, value: teacher.teacher_name },
        { name: 'pulpit', type: sql.NVarChar, value: teacher.pulpit }
      ];
      await executeQuery(updateQuery, updateParams);
    } else {
      const insertQuery = `
        INSERT INTO TEACHER (TEACHER, TEACHER_NAME, PULPIT)
        VALUES (@teacher, @teacher_name, @pulpit)
      `;
      const insertParams = [
        { name: 'teacher', type: sql.NVarChar, value: teacher.teacher },
        { name: 'teacher_name', type: sql.NVarChar, value: teacher.teacher_name },
        { name: 'pulpit', type: sql.NVarChar, value: teacher.pulpit }
      ];
      await executeQuery(insertQuery, insertParams);
    }
    return teacher;
  },

  setPulpit: async ({ pulpit }) => {
    const checkQuery = 'SELECT * FROM PULPIT WHERE PULPIT = @pulpit';
    const checkParams = [{ name: 'pulpit', type: sql.NVarChar, value: pulpit.pulpit }];
    const exists = await executeQuery(checkQuery, checkParams);

    if (exists.length > 0) {
      const updateQuery = `
        UPDATE PULPIT SET PULPIT_NAME = @pulpit_name, FACULTY = @faculty
        WHERE PULPIT = @pulpit
      `;
      const updateParams = [
        { name: 'pulpit', type: sql.NVarChar, value: pulpit.pulpit },
        { name: 'pulpit_name', type: sql.NVarChar, value: pulpit.pulpit_name },
        { name: 'faculty', type: sql.NVarChar, value: pulpit.faculty }
      ];
      await executeQuery(updateQuery, updateParams);
    } else {
      const insertQuery = `
        INSERT INTO PULPIT (PULPIT, PULPIT_NAME, FACULTY)
        VALUES (@pulpit, @pulpit_name, @faculty)
      `;
      const insertParams = [
        { name: 'pulpit', type: sql.NVarChar, value: pulpit.pulpit },
        { name: 'pulpit_name', type: sql.NVarChar, value: pulpit.pulpit_name },
        { name: 'faculty', type: sql.NVarChar, value: pulpit.faculty }
      ];
      await executeQuery(insertQuery, insertParams);
    }
    return pulpit;
  },

  setSubject: async ({ subject }) => {
    const checkQuery = 'SELECT * FROM SUBJECT WHERE SUBJECT = @subject';
    const checkParams = [{ name: 'subject', type: sql.NVarChar, value: subject.subject }];
    const exists = await executeQuery(checkQuery, checkParams);

    if (exists.length > 0) {
      const updateQuery = `
        UPDATE SUBJECT SET SUBJECT_NAME = @subject_name, PULPIT = @pulpit
        WHERE SUBJECT = @subject
      `;
      const updateParams = [
        { name: 'subject', type: sql.NVarChar, value: subject.subject },
        { name: 'subject_name', type: sql.NVarChar, value: subject.subject_name },
        { name: 'pulpit', type: sql.NVarChar, value: subject.pulpit }
      ];
      await executeQuery(updateQuery, updateParams);
    } else {
      const insertQuery = `
        INSERT INTO SUBJECT (SUBJECT, SUBJECT_NAME, PULPIT)
        VALUES (@subject, @subject_name, @pulpit)
      `;
      const insertParams = [
        { name: 'subject', type: sql.NVarChar, value: subject.subject },
        { name: 'subject_name', type: sql.NVarChar, value: subject.subject_name },
        { name: 'pulpit', type: sql.NVarChar, value: subject.pulpit }
      ];
      await executeQuery(insertQuery, insertParams);
    }
    return subject;
  },

  delFaculty: async ({ faculty }) => {
    const checkQuery = 'SELECT * FROM FACULTY WHERE FACULTY = @faculty';
    const checkParams = [{ name: 'faculty', type: sql.NVarChar, value: faculty }];
    const exists = await executeQuery(checkQuery, checkParams);
    if (exists.length === 0) return false;
    const deleteQuery = 'DELETE FROM FACULTY WHERE FACULTY = @faculty';
    await executeQuery(deleteQuery, checkParams);
    return true;
  },

  delTeacher: async ({ teacher }) => {
    const checkQuery = 'SELECT * FROM TEACHER WHERE TEACHER = @teacher';
    const checkParams = [{ name: 'teacher', type: sql.NVarChar, value: teacher }];
    const exists = await executeQuery(checkQuery, checkParams);
    if (exists.length === 0) return false;
    const deleteQuery = 'DELETE FROM TEACHER WHERE TEACHER = @teacher';
    await executeQuery(deleteQuery, checkParams);
    return true;
  },

  delPulpit: async ({ pulpit }) => {
    const checkQuery = 'SELECT * FROM PULPIT WHERE PULPIT = @pulpit';
    const checkParams = [{ name: 'pulpit', type: sql.NVarChar, value: pulpit }];
    const exists = await executeQuery(checkQuery, checkParams);
    if (exists.length === 0) return false;
    const deleteQuery = 'DELETE FROM PULPIT WHERE PULPIT = @pulpit';
    await executeQuery(deleteQuery, checkParams);
    return true;
  },

  delSubject: async ({ subject }) => {
    const checkQuery = 'SELECT * FROM SUBJECT WHERE SUBJECT = @subject';
    const checkParams = [{ name: 'subject', type: sql.NVarChar, value: subject }];
    const exists = await executeQuery(checkQuery, checkParams);
    if (exists.length === 0) return false;
    const deleteQuery = 'DELETE FROM SUBJECT WHERE SUBJECT = @subject';
    await executeQuery(deleteQuery, checkParams);
    return true;
  }
};

module.exports = resolvers;