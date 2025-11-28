
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'front')));

console.log('carregando rotas ');

try {
    const rotas = require('./routes/routes');
    console.log('Rotas carregadas com sucesso');
    app.use('/api', rotas);
} catch (erro) {
    console.error('ERRO ao carregar rotas:', erro);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'front', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});