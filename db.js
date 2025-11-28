const mysql = require('mysql2/promise');
const path = require('path'); 


require('dotenv').config({ path: path.resolve(__dirname, '.env') });


console.log('Tentando conectar com Usuário:', process.env.DB_USER);
console.log('Tentando conectar no Banco:', process.env.DB_NAME);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()

    .then(connection => {
        console.log(' Conectou no MySQL com sucesso!');
        connection.release();
    })
    .catch(err => {
        console.error('Erro ao conectar no MySQL:', err.code);

        console.error(`Detalhes: User=${process.env.DB_USER}, Host=${process.env.DB_HOST}`);
    });

module.exports = pool;