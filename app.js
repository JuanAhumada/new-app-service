require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

const mysqlConnection = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

const pgPool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
});

app.get('/', (req, res) => {
    res.render('inicio');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/registro', (req, res) => {
    res.render('registro');
});

app.post('/registro', async (req, res) => {
    const { nombre, apellido, usuario, password } = req.body;
    try {
        await mysqlConnection.query('INSERT INTO usuarios (nombre, apellido, usuario, password) VALUES (?, ?, ?, ?)', [nombre, apellido, usuario, password]);
        await pgPool.query('INSERT INTO usuarios (nombre, apellido, usuario, password) VALUES ($1, $2, $3, $4)', [nombre, apellido, usuario, password]);
        res.redirect('/login');
    } catch (error) {
        console.error('Error registrando:', error);
        res.send('Error registrando usuario');
    }
});

app.post('/login', async (req, res) => {
    const { usuario, password } = req.body;
    try {
        const [rows] = await mysqlConnection.query('SELECT * FROM usuarios WHERE usuario = ? AND password = ?', [usuario, password]);
        if (rows.length > 0) {
            req.session.usuario = rows[0].nombre;
            return res.redirect('/usuario');
        } else {
            res.send('Credenciales inválidas');
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.send('Error en login');
    }
});

app.get('/usuario', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    res.render('usuario', { usuario: req.session.usuario });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
