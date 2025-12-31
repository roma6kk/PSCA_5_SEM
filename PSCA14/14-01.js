var http = require('http');
var url = require('url');
var fs = require('fs');
const sql = require('mssql');
const dbConfig = require('./dbconfig.js');

let pool;

async function init() {
  try {
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log('MS SQL Server connection pool established');
    return true;
  } catch (err) {
    console.error('init() error: ' + err.message);
    return false;
  }
}

async function ExecuteSQL(sqlQuery, params = []) {
  try {
    console.log('Executing SQL:', sqlQuery);
    const request = pool.request();
    
    params.forEach((param, index) => {
      request.input(`param${index}`, sql.VarChar, param);
    });
    
    const result = await request.query(sqlQuery);
    return result;
  } catch (err) {
    console.error('SQL Error:', err.message);
    
    if (err.message.includes('violation of PRIMARY KEY constraint') || 
        err.message.includes('duplicate key')) {
      throw { type: 'CONFLICT', message: 'Запись с таким ключом уже существует' };
    } else if (err.message.includes('foreign key constraint')) {
      throw { type: 'CONFLICT', message: 'Нарушение ссылочной целостности' };
    } else if (err.message.includes('invalid object')) {
      throw { type: 'NOT_FOUND', message: 'Таблица не найдена' };
    }
    
    throw { type: 'INTERNAL_ERROR', message: err.message };
  }
}

async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      console.log('Connection pool closed');
    }
  } catch (err) {
    console.error(err.message);
  }
  process.exit(0);
}

process.once('SIGTERM', closeConnection);
process.once('SIGINT', closeConnection);

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, errorCode, message) {
  sendJsonResponse(res, statusCode, { 
    error: errorCode, 
    message: message,
    timestamp: new Date().toISOString()
  });
}

function sendSuccess(res, data) {
  sendJsonResponse(res, 200, data);
}

async function checkExists(table, field, value) {
  try {
    if (!value || typeof value !== 'string') {
      console.log(`checkExists: invalid value for ${table}.${field}:`, value);
      return false;
    }
    
    const cleanValue = value.trim();
    console.log(`checkExists: ищем ${table}.${field} = "${cleanValue}"`);
    
    let sqlQuery = `SELECT COUNT(*) as count FROM ${table} WHERE ${field} = @value`;
    let request = pool.request();
    request.input('value', sql.VarChar, cleanValue);
    let result = await request.query(sqlQuery);
    
    if (result.recordset[0].count > 0) {
      console.log(`Найдено точное совпадение в ${table}.${field} = "${cleanValue}"`);
      return true;
    }
    
    sqlQuery = `SELECT COUNT(*) as count FROM ${table} WHERE UPPER(${field}) = UPPER(@value)`;
    request = pool.request();
    request.input('value', sql.VarChar, cleanValue);
    result = await request.query(sqlQuery);
    
    const found = result.recordset[0].count > 0;
    console.log(found ? 
      `Найдено регистронезависимое совпадение в ${table}.${field} = "${cleanValue}"` :
      `Не найдено в ${table}.${field} = "${cleanValue}"`
    );
    
    return found;
  } catch (err) {
    console.error('checkExists error:', err.message);
    return false;
  }
}

async function http_handler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`${req.method} ${pathname}`);

  try {
    if (req.method === 'GET') {
      await handleGetRequests(req, res, pathname);
    }
    else if (req.method === 'POST') {
      await handlePostRequests(req, res, pathname);
    }
    else if (req.method === 'PUT') {
      await handlePutRequests(req, res, pathname);
    }
    else if (req.method === 'DELETE') {
      await handleDeleteRequests(req, res, pathname);
    }
    else {
      sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается');
    }
  } catch (err) {
    console.error('Unhandled error:', err);
    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Внутренняя ошибка сервера');
  }
}

async function handleGetRequests(req, res, pathname) {
  try {
    if (pathname === '/') {
      let html = fs.readFileSync('./14-01.html');
      res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8'
      });
      res.end(html);
      return;
    }

    let result;
    let data;
    
    switch (pathname) {
      case '/api/faculties':
        result = await ExecuteSQL('SELECT FACULTY, FACULTY_NAME FROM FACULTY');
        data = result.recordset.map(row => ({
          faculty: row.FACULTY,
          faculty_name: row.FACULTY_NAME
        }));
        sendSuccess(res, { 
          count: data.length,
          data: data 
        });
        break;

      case '/api/pulpits':
        result = await ExecuteSQL('SELECT PULPIT, PULPIT_NAME, FACULTY FROM PULPIT');
        data = result.recordset.map(row => ({
          pulpit: row.PULPIT,
          pulpit_name: row.PULPIT_NAME,
          faculty: row.FACULTY
        }));
        sendSuccess(res, { 
          count: data.length,
          data: data 
        });
        break;

      case '/api/subjects':
        result = await ExecuteSQL('SELECT SUBJECT, SUBJECT_NAME, PULPIT FROM SUBJECT');
        data = result.recordset.map(row => ({
          subject: row.SUBJECT,
          subject_name: row.SUBJECT_NAME,
          pulpit: row.PULPIT
        }));
        sendSuccess(res, { 
          count: data.length,
          data: data 
        });
        break;

      case '/api/auditoriumstypes':
        result = await ExecuteSQL('SELECT AUDITORIUM_TYPE, AUDITORIUM_TYPENAME FROM AUDITORIUM_TYPE');
        data = result.recordset.map(row => ({
          auditorium_type: row.AUDITORIUM_TYPE,
          auditorium_typename: row.AUDITORIUM_TYPENAME
        }));
        sendSuccess(res, { 
          count: data.length,
          data: data 
        });
        break;

      case '/api/auditoriums':
        result = await ExecuteSQL('SELECT AUDITORIUM, AUDITORIUM_NAME, AUDITORIUM_CAPACITY, AUDITORIUM_TYPE FROM AUDITORIUM');
        data = result.recordset.map(row => ({
          auditorium: row.AUDITORIUM,
          auditorium_name: row.AUDITORIUM_NAME,
          auditorium_capacity: row.AUDITORIUM_CAPACITY,
          auditorium_type: row.AUDITORIUM_TYPE
        }));
        sendSuccess(res, { 
          count: data.length,
          data: data 
        });
        break;

      default:
        sendError(res, 404, 'NOT_FOUND', 'Ресурс не найден');
    }
  } catch (err) {
    if (err.type === 'NOT_FOUND') {
      sendError(res, 404, 'RESOURCE_NOT_FOUND', err.message);
    } else {
      sendError(res, 500, 'GET_ERROR', 'Ошибка при получении данных');
    }
  }
}

async function handlePostRequests(req, res, pathname) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  
  req.on('end', async () => {
    try {
      if (!body) {
        sendError(res, 400, 'BAD_REQUEST', 'Тело запроса пустое');
        return;
      }

      let data;
      try {
        data = JSON.parse(body);
      } catch (parseErr) {
        sendError(res, 400, 'INVALID_JSON', 'Неверный формат JSON');
        return;
      }

      let missingFields = [];
      
      switch (pathname) {
        case '/api/faculties':
          if (!data.faculty) missingFields.push('faculty');
          if (!data.faculty_name) missingFields.push('faculty_name');
          
          if (missingFields.length > 0) {
            sendError(res, 400, 'VALIDATION_ERROR', `Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
            return;
          }
          
          const facultyExists = await checkExists('FACULTY', 'FACULTY', data.faculty);
          if (facultyExists) {
            sendError(res, 409, 'CONFLICT', 'Факультет с таким кодом уже существует');
            return;
          }
          
          const facultySql = `INSERT INTO FACULTY(FACULTY, FACULTY_NAME) VALUES(@faculty, @faculty_name)`;
          const request1 = pool.request();
          request1.input('faculty', sql.VarChar, data.faculty);
          request1.input('faculty_name', sql.VarChar, data.faculty_name);
          const facultyResult = await request1.query(facultySql);
          
          if (facultyResult.rowsAffected[0] > 0) {
            sendJsonResponse(res, 201, {
              faculty: data.faculty,
              faculty_name: data.faculty_name,
              message: 'Факультет успешно создан'
            });
          } else {
            sendError(res, 500, 'INSERT_ERROR', 'Не удалось создать факультет');
          }
          break;

        case '/api/pulpits':
          if (!data.pulpit) missingFields.push('pulpit');
          if (!data.pulpit_name) missingFields.push('pulpit_name');
          if (!data.faculty) missingFields.push('faculty');
          
          if (missingFields.length > 0) {
            sendError(res, 400, 'VALIDATION_ERROR', `Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
            return;
          }
          
          const parentFacultyExists = await checkExists('FACULTY', 'FACULTY', data.faculty);
          if (!parentFacultyExists) {
            sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанный факультет не существует');
            return;
          }
          
          const pulpitExists = await checkExists('PULPIT', 'PULPIT', data.pulpit);
          if (pulpitExists) {
            sendError(res, 409, 'CONFLICT', 'Кафедра с таким кодом уже существует');
            return;
          }
          
          const pulpitSql = `INSERT INTO PULPIT(PULPIT, PULPIT_NAME, FACULTY) VALUES(@pulpit, @pulpit_name, @faculty)`;
          const request2 = pool.request();
          request2.input('pulpit', sql.VarChar, data.pulpit);
          request2.input('pulpit_name', sql.VarChar, data.pulpit_name);
          request2.input('faculty', sql.VarChar, data.faculty);
          const pulpitResult = await request2.query(pulpitSql);
          
          if (pulpitResult.rowsAffected[0] > 0) {
            sendJsonResponse(res, 201, {
              pulpit: data.pulpit,
              pulpit_name: data.pulpit_name,
              faculty: data.faculty,
              message: 'Кафедра успешно создана'
            });
          } else {
            sendError(res, 500, 'INSERT_ERROR', 'Не удалось создать кафедру');
          }
          break;

        case '/api/subjects':
          if (!data.subject) missingFields.push('subject');
          if (!data.subject_name) missingFields.push('subject_name');
          if (!data.pulpit) missingFields.push('pulpit');
          
          if (missingFields.length > 0) {
            sendError(res, 400, 'VALIDATION_ERROR', `Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
            return;
          }
          
          const parentPulpitExists = await checkExists('PULPIT', 'PULPIT', data.pulpit);
          if (!parentPulpitExists) {
            sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанная кафедра не существует');
            return;
          }
          
          const subjectExists = await checkExists('SUBJECT', 'SUBJECT', data.subject);
          if (subjectExists) {
            sendError(res, 409, 'CONFLICT', 'Предмет с таким кодом уже существует');
            return;
          }
          
          const subjectSql = `INSERT INTO SUBJECT(SUBJECT, SUBJECT_NAME, PULPIT) VALUES(@subject, @subject_name, @pulpit)`;
          const request3 = pool.request();
          request3.input('subject', sql.VarChar, data.subject);
          request3.input('subject_name', sql.VarChar, data.subject_name);
          request3.input('pulpit', sql.VarChar, data.pulpit);
          const subjectResult = await request3.query(subjectSql);
          
          if (subjectResult.rowsAffected[0] > 0) {
            sendJsonResponse(res, 201, {
              subject: data.subject,
              subject_name: data.subject_name,
              pulpit: data.pulpit,
              message: 'Предмет успешно создан'
            });
          } else {
            sendError(res, 500, 'INSERT_ERROR', 'Не удалось создать предмет');
          }
          break;

        case '/api/auditoriumstypes':
          if (!data.auditorium_type) missingFields.push('auditorium_type');
          if (!data.auditorium_typename) missingFields.push('auditorium_typename');
          
          if (missingFields.length > 0) {
            sendError(res, 400, 'VALIDATION_ERROR', `Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
            return;
          }
          
          const typeExists = await checkExists('AUDITORIUM_TYPE', 'AUDITORIUM_TYPE', data.auditorium_type);
          if (typeExists) {
            sendError(res, 409, 'CONFLICT', 'Тип аудитории с таким кодом уже существует');
            return;
          }
          
          const typeSql = `INSERT INTO AUDITORIUM_TYPE(AUDITORIUM_TYPE, AUDITORIUM_TYPENAME) VALUES(@auditorium_type, @auditorium_typename)`;
          const request4 = pool.request();
          request4.input('auditorium_type', sql.VarChar, data.auditorium_type);
          request4.input('auditorium_typename', sql.VarChar, data.auditorium_typename);
          const typeResult = await request4.query(typeSql);
          
          if (typeResult.rowsAffected[0] > 0) {
            sendJsonResponse(res, 201, {
              auditorium_type: data.auditorium_type,
              auditorium_typename: data.auditorium_typename,
              message: 'Тип аудитории успешно создан'
            });
          } else {
            sendError(res, 500, 'INSERT_ERROR', 'Не удалось создать тип аудитории');
          }
          break;

        case '/api/auditoriums':
          if (!data.auditorium) missingFields.push('auditorium');
          if (!data.auditorium_name) missingFields.push('auditorium_name');
          if (!data.auditorium_capacity) missingFields.push('auditorium_capacity');
          if (!data.auditorium_type) missingFields.push('auditorium_type');
          
          if (missingFields.length > 0) {
            sendError(res, 400, 'VALIDATION_ERROR', `Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
            return;
          }
          
          const parentTypeExists = await checkExists('AUDITORIUM_TYPE', 'AUDITORIUM_TYPE', data.auditorium_type);
          if (!parentTypeExists) {
            sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанный тип аудитории не существует');
            return;
          }

          const auditoriumExists = await checkExists('AUDITORIUM', 'AUDITORIUM', data.auditorium);
          if (auditoriumExists) {
            sendError(res, 409, 'CONFLICT', 'Аудитория с таким кодом уже существует');
            return;
          }
          
          const auditoriumSql = `INSERT INTO AUDITORIUM(AUDITORIUM, AUDITORIUM_NAME, AUDITORIUM_CAPACITY, AUDITORIUM_TYPE) VALUES(@auditorium, @auditorium_name, @auditorium_capacity, @auditorium_type)`;
          const request5 = pool.request();
          request5.input('auditorium', sql.VarChar, data.auditorium);
          request5.input('auditorium_name', sql.VarChar, data.auditorium_name);
          request5.input('auditorium_capacity', sql.Int, data.auditorium_capacity);
          request5.input('auditorium_type', sql.VarChar, data.auditorium_type);
          const auditoriumResult = await request5.query(auditoriumSql);
          
          if (auditoriumResult.rowsAffected[0] > 0) {
            sendJsonResponse(res, 201, {
              auditorium: data.auditorium,
              auditorium_name: data.auditorium_name,
              auditorium_capacity: data.auditorium_capacity,
              auditorium_type: data.auditorium_type,
              message: 'Аудитория успешно создана'
            });
          } else {
            sendError(res, 500, 'INSERT_ERROR', 'Не удалось создать аудиторию');
          }
          break;

        default:
          sendError(res, 404, 'NOT_FOUND', 'Ресурс не найден');
      }
    } catch (err) {
      console.error('POST Error:', err);
      
      if (err.type === 'CONFLICT') {
        sendError(res, 409, 'CONFLICT', err.message);
      } else if (err.type === 'NOT_FOUND') {
        sendError(res, 404, 'NOT_FOUND', err.message);
      } else {
        sendError(res, 500, 'INTERNAL_ERROR', 'Ошибка при создании записи');
      }
    }
  });
}

async function handlePutRequests(req, res, pathname) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  
  req.on('end', async () => {
    try {
      if (!body) {
        sendError(res, 400, 'BAD_REQUEST', 'Тело запроса пустое');
        return;
      }

      let data;
      try {
        data = JSON.parse(body);
      } catch (parseErr) {
        sendError(res, 400, 'INVALID_JSON', 'Неверный формат JSON');
        return;
      }

      switch (pathname) {
        case '/api/faculties':
          if (!data.faculty) {
            sendError(res, 400, 'VALIDATION_ERROR', 'Поле faculty обязательно');
            return;
          }
          
          const facultyExists = await checkExists('FACULTY', 'FACULTY', data.faculty);
          if (!facultyExists) {
            sendError(res, 404, 'NOT_FOUND', 'Факультет не найден');
            return;
          }
          
          if (!data.faculty_name) {
            sendError(res, 400, 'VALIDATION_ERROR', 'Поле faculty_name обязательно');
            return;
          }
          
          const facultySql = `UPDATE FACULTY SET FACULTY_NAME=@faculty_name WHERE FACULTY=@faculty`;
          const request1 = pool.request();
          request1.input('faculty', sql.VarChar, data.faculty);
          request1.input('faculty_name', sql.VarChar, data.faculty_name);
          const facultyResult = await request1.query(facultySql);
          
          if (facultyResult.rowsAffected[0] > 0) {
            sendSuccess(res, {
              faculty: data.faculty,
              faculty_name: data.faculty_name,
              message: 'Факультет успешно обновлен'
            });
          } else {
            sendError(res, 404, 'NOT_FOUND', 'Факультет не найден');
          }
          break;

        case '/api/pulpits':
          if (!data.pulpit) {
            sendError(res, 400, 'VALIDATION_ERROR', 'Поле pulpit обязательно');
            return;
          }
          
          const pulpitExists = await checkExists('PULPIT', 'PULPIT', data.pulpit);
          if (!pulpitExists) {
            sendError(res, 404, 'NOT_FOUND', 'Кафедра не найдена');
            return;
          }
          
          if (data.faculty) {
            const newFacultyExists = await checkExists('FACULTY', 'FACULTY', data.faculty);
            if (!newFacultyExists) {
              sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанный факультет не существует');
              return;
            }
          }
          
          let pulpitUpdates = [];
          let pulpitParams = {};
          
          if (data.pulpit_name) {
            pulpitUpdates.push(`PULPIT_NAME=@pulpit_name`);
            pulpitParams.pulpit_name = data.pulpit_name;
          }
          if (data.faculty) {
            pulpitUpdates.push(`FACULTY=@faculty`);
            pulpitParams.faculty = data.faculty;
          }
          
          if (pulpitUpdates.length === 0) {
            sendError(res, 400, 'VALIDATION_ERROR', 'Нет данных для обновления');
            return;
          }
          
          const pulpitSql = `UPDATE PULPIT SET ${pulpitUpdates.join(', ')} WHERE PULPIT=@pulpit`;
          const request2 = pool.request();
          request2.input('pulpit', sql.VarChar, data.pulpit);
          
          if (data.pulpit_name) request2.input('pulpit_name', sql.VarChar, data.pulpit_name);
          if (data.faculty) request2.input('faculty', sql.VarChar, data.faculty);
          
          const pulpitResult = await request2.query(pulpitSql);
          
          if (pulpitResult.rowsAffected[0] > 0) {
            const selectSql = `SELECT PULPIT, PULPIT_NAME, FACULTY FROM PULPIT WHERE PULPIT=@pulpit`;
            const request2a = pool.request();
            request2a.input('pulpit', sql.VarChar, data.pulpit);
            const selectResult = await request2a.query(selectSql);
            
            sendSuccess(res, {
              ...selectResult.recordset[0],
              message: 'Кафедра успешно обновлена'
            });
          } else {
            sendError(res, 404, 'NOT_FOUND', 'Кафедра не найдена');
          }
          break;

        case '/api/subjects':
          if (!data.subject) {
            sendError(res, 400, 'VALIDATION_ERROR', 'Поле subject обязательно');
            return;
          }
          
          const subjectExists = await checkExists('SUBJECT', 'SUBJECT', data.subject);
          if (!subjectExists) {
            sendError(res, 404, 'NOT_FOUND', 'Предмет не найден');
            return;
          }
          
          if (data.pulpit) {
            const newPulpitExists = await checkExists('PULPIT', 'PULPIT', data.pulpit);
            if (!newPulpitExists) {
              sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанная кафедра не существует');
              return;
            }
          }
          
          const subjectUpdates = [];
          if (data.subject_name) subjectUpdates.push(`SUBJECT_NAME=@subject_name`);
          if (data.pulpit) subjectUpdates.push(`PULPIT=@pulpit`);
          
          if (subjectUpdates.length === 0) {
            sendError(res, 400, 'VALIDATION_ERROR', 'Нет данных для обновления');
            return;
          }
          
          const subjectSql = `UPDATE SUBJECT SET ${subjectUpdates.join(', ')} WHERE SUBJECT=@subject`;
          const request3 = pool.request();
          request3.input('subject', sql.VarChar, data.subject);
          if (data.subject_name) request3.input('subject_name', sql.VarChar, data.subject_name);
          if (data.pulpit) request3.input('pulpit', sql.VarChar, data.pulpit);
          
          const subjectResult = await request3.query(subjectSql);
          
          if (subjectResult.rowsAffected[0] > 0) {
            sendSuccess(res, {
              subject: data.subject,
              subject_name: data.subject_name || undefined,
              pulpit: data.pulpit || undefined,
              message: 'Предмет успешно обновлен'
            });
          } else {
            sendError(res, 404, 'NOT_FOUND', 'Предмет не найден');
          }
          break;

        case '/api/auditoriumstypes':
          if (!data.auditorium_type) {
            sendError(res, 400, 'VALIDATION_ERROR', 'Поле auditorium_type обязательно');
            return;
          }
          
          const typeExists = await checkExists('AUDITORIUM_TYPE', 'AUDITORIUM_TYPE', data.auditorium_type);
          if (!typeExists) {
            sendError(res, 404, 'NOT_FOUND', 'Тип аудитории не найден');
            return;
          }
          
          if (!data.auditorium_typename) {
            sendError(res, 400, 'VALIDATION_ERROR', 'Поле auditorium_typename обязательно');
            return;
          }
          
          const typeSql = `UPDATE AUDITORIUM_TYPE SET AUDITORIUM_TYPENAME=@auditorium_typename WHERE AUDITORIUM_TYPE=@auditorium_type`;
          const request4 = pool.request();
          request4.input('auditorium_type', sql.VarChar, data.auditorium_type);
          request4.input('auditorium_typename', sql.VarChar, data.auditorium_typename);
          const typeResult = await request4.query(typeSql);
          
          if (typeResult.rowsAffected[0] > 0) {
            sendSuccess(res, {
              auditorium_type: data.auditorium_type,
              auditorium_typename: data.auditorium_typename,
              message: 'Тип аудитории успешно обновлен'
            });
          } else {
            sendError(res, 404, 'NOT_FOUND', 'Тип аудитории не найден');
          }
          break;

        case '/api/auditoriums':
          if (!data.auditorium) {
            sendError(res, 400, 'VALIDATION_ERROR', 'Поле auditorium обязательно');
            return;
          }
          
          const auditoriumExists = await checkExists('AUDITORIUM', 'AUDITORIUM', data.auditorium);
          if (!auditoriumExists) {
            sendError(res, 404, 'NOT_FOUND', 'Аудитория не найдена');
            return;
          }
          
          if (data.auditorium_type) {
            const newTypeExists = await checkExists('AUDITORIUM_TYPE', 'AUDITORIUM_TYPE', data.auditorium_type);
            if (!newTypeExists) {
              sendError(res, 404, 'PARENT_NOT_FOUND', 'Указанный тип аудитории не существует');
              return;
            }
          }
          
          const auditoriumUpdates = [];
          if (data.auditorium_name) auditoriumUpdates.push(`AUDITORIUM_NAME=@auditorium_name`);
          if (data.auditorium_capacity) auditoriumUpdates.push(`AUDITORIUM_CAPACITY=@auditorium_capacity`);
          if (data.auditorium_type) auditoriumUpdates.push(`AUDITORIUM_TYPE=@auditorium_type`);
          
          if (auditoriumUpdates.length === 0) {
            sendError(res, 400, 'VALIDATION_ERROR', 'Нет данных для обновления');
            return;
          }
          
          const auditoriumSql = `UPDATE AUDITORIUM SET ${auditoriumUpdates.join(', ')} WHERE AUDITORIUM=@auditorium`;
          const request5 = pool.request();
          request5.input('auditorium', sql.VarChar, data.auditorium);
          if (data.auditorium_name) request5.input('auditorium_name', sql.VarChar, data.auditorium_name);
          if (data.auditorium_capacity) request5.input('auditorium_capacity', sql.Int, data.auditorium_capacity);
          if (data.auditorium_type) request5.input('auditorium_type', sql.VarChar, data.auditorium_type);
          
          const auditoriumResult = await request5.query(auditoriumSql);
          
          if (auditoriumResult.rowsAffected[0] > 0) {
            sendSuccess(res, {
              auditorium: data.auditorium,
              auditorium_name: data.auditorium_name || undefined,
              auditorium_capacity: data.auditorium_capacity || undefined,
              auditorium_type: data.auditorium_type || undefined,
              message: 'Аудитория успешно обновлена'
            });
          } else {
            sendError(res, 404, 'NOT_FOUND', 'Аудитория не найдена');
          }
          break;

        default:
          sendError(res, 404, 'NOT_FOUND', 'Ресурс не найден');
      }
    } catch (err) {
      console.error('PUT Error:', err);
      
      if (err.type === 'CONFLICT') {
        sendError(res, 409, 'CONFLICT', err.message);
      } else if (err.type === 'NOT_FOUND') {
        sendError(res, 404, 'NOT_FOUND', err.message);
      } else {
        sendError(res, 500, 'INTERNAL_ERROR', 'Ошибка при обновлении записи');
      }
    }
  });
}

async function handleDeleteRequests(req, res, pathname) {
  try {
    const pathParts = pathname.split('/');
    const id = decodeURIComponent(pathParts[pathParts.length - 1]);
    
    if (!id || id === 'api') {
      sendError(res, 400, 'BAD_REQUEST', 'Не указан идентификатор для удаления');
      return;
    }

    let selectSql, deleteSql, entityName, tableName, keyField;

    if (pathname.startsWith('/api/faculties/')) {
      tableName = 'FACULTY';
      keyField = 'FACULTY';
      entityName = 'факультет';
      selectSql = `SELECT FACULTY, FACULTY_NAME FROM ${tableName} WHERE ${keyField}=@id`;
      deleteSql = `DELETE FROM ${tableName} WHERE ${keyField}=@id`;
    } 
    else if (pathname.startsWith('/api/pulpits/')) {
      tableName = 'PULPIT';
      keyField = 'PULPIT';
      entityName = 'кафедра';
      selectSql = `SELECT PULPIT, PULPIT_NAME, FACULTY FROM ${tableName} WHERE ${keyField}=@id`;
      deleteSql = `DELETE FROM ${tableName} WHERE ${keyField}=@id`;
    } 
    else if (pathname.startsWith('/api/subjects/')) {
      tableName = 'SUBJECT';
      keyField = 'SUBJECT';
      entityName = 'предмет';
      selectSql = `SELECT SUBJECT, SUBJECT_NAME, PULPIT FROM ${tableName} WHERE ${keyField}=@id`;
      deleteSql = `DELETE FROM ${tableName} WHERE ${keyField}=@id`;
    } 
    else if (pathname.startsWith('/api/auditoriumstypes/')) {
      tableName = 'AUDITORIUM_TYPE';
      keyField = 'AUDITORIUM_TYPE';
      entityName = 'тип аудитории';
      selectSql = `SELECT AUDITORIUM_TYPE, AUDITORIUM_TYPENAME FROM ${tableName} WHERE ${keyField}=@id`;
      deleteSql = `DELETE FROM ${tableName} WHERE ${keyField}=@id`;
    } 
    else if (pathname.startsWith('/api/auditoriums/')) {
      tableName = 'AUDITORIUM';
      keyField = 'AUDITORIUM';
      entityName = 'аудитория';
      selectSql = `SELECT AUDITORIUM, AUDITORIUM_NAME, AUDITORIUM_CAPACITY, AUDITORIUM_TYPE FROM ${tableName} WHERE ${keyField}=@id`;
      deleteSql = `DELETE FROM ${tableName} WHERE ${keyField}=@id`;
    } 
    else {
      sendError(res, 404, 'NOT_FOUND', 'Ресурс не найден');
      return;
    }

    const request1 = pool.request();
    request1.input('id', sql.VarChar, id);
    const selectResult = await request1.query(selectSql);
    
    if (selectResult.recordset.length === 0) {
      sendError(res, 404, 'NOT_FOUND', `${entityName} не найден`);
      return;
    }

    try {
      const request2 = pool.request();
      request2.input('id', sql.VarChar, id);
      const deleteResult = await request2.query(deleteSql);
      
      if (deleteResult.rowsAffected[0] > 0) {
        sendSuccess(res, {
          ...selectResult.recordset[0],
          message: `${entityName} успешно удалена`
        });
      } else {
        sendError(res, 404, 'NOT_FOUND', `${entityName} не найден`);
      }
    } catch (deleteErr) {
      if (deleteErr.type === 'CONFLICT') {
        sendError(res, 409, 'CONFLICT', `Нельзя удалить ${entityName}, так как на него есть ссылки`);
      } else {
        throw deleteErr;
      }
    }

  } catch (err) {
    console.error('DELETE Error:', err);
    
    if (err.type === 'CONFLICT') {
      sendError(res, 409, 'CONFLICT', err.message);
    } else if (err.type === 'NOT_FOUND') {
      sendError(res, 404, 'NOT_FOUND', err.message);
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'Ошибка при удалении записи');
    }
  }
}

init().then(success => {
  if (success) {
    const server = http.createServer(http_handler);
    
    server.listen(5000, () => {
      console.log('Server running at http://localhost:5000/');
      console.log('Available endpoints:');
      console.log('  GET  /api/faculties');
      console.log('  GET  /api/pulpits');
      console.log('  GET  /api/subjects');
      console.log('  GET  /api/auditoriumstypes');
      console.log('  GET  /api/auditoriums');
      console.log('  POST /api/faculties');
      console.log('  POST /api/pulpits');
      console.log('  POST /api/subjects');
      console.log('  POST /api/auditoriumstypes');
      console.log('  POST /api/auditoriums');
      console.log('  PUT  /api/faculties');
      console.log('  PUT  /api/pulpits');
      console.log('  PUT  /api/subjects');
      console.log('  PUT  /api/auditoriumstypes');
      console.log('  PUT  /api/auditoriums');
      console.log('  DELETE /api/faculties/{id}');
      console.log('  DELETE /api/pulpits/{id}');
      console.log('  DELETE /api/subjects/{id}');
      console.log('  DELETE /api/auditoriumstypes/{id}');
      console.log('  DELETE /api/auditoriums/{id}');
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error('Port 5000 is already in use');
      }
    });
  } else {
    console.error('Failed to initialize database connection. Exiting...');
    process.exit(1);
  }
});