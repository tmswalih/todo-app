const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',        
  database: 'todo_app' 
});

db.connect((err) => {
  if (err) {
    console.log('Database connection failed:', err);
  } else {
    console.log('MySQL connected successfully');
  }
});

module.exports = db;
