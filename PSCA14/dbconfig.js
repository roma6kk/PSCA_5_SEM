module.exports = {
  user: 'sttudent',
  password: 'xfitfit',
  server: 'localhost',
  database: 'UNIVER',
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};