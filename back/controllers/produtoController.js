const pool = require ('../../db'); 
const axios = require('axios');

exports.importarProdutosFakeStore = async (req, res) => {
    try {
        const resposta = await axios.get('https://fakestoreapi.com/products');
        const listaProdutos = resposta.data; 

        await pool.query('DELETE FROM produtos');

        for (const produto of listaProdutos) {
            const sql = `
                INSERT INTO produtos (titulo, descricao, preco, categoria, imagem_url, estoque)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const valores = [
                produto.title,
                produto.description,
                produto.price,
                produto.category,
                produto.image,
                10 
            ];

            try {
                await pool.query(sql, valores);
            } catch (erroInsert) {
                console.error('Erro ao inserir produto:', produto.title, erroInsert);
            }
        }

        res.status(200).send('Produtos importados com sucesso');

    } catch (erro) {
        console.error(erro);
        res.status(500).send('Erro ao importar produtos.');
    }
};

exports.listarProdutos = async (req, res) => {
    try {
        const { categoria, busca } = req.query;

        let sql = 'SELECT * FROM produtos';
        const valores = [];

        if (categoria) {
            sql += ' WHERE categoria = ?';
            valores.push(categoria);
        }

        else if (busca) {
            sql += ' WHERE titulo LIKE ?';
            valores.push(`%${busca}%`);
        }

        const [produtos] = await pool.query(sql, valores);

        res.json(produtos);
        
    } catch (erro) {
        console.error(erro);
        res.status(500).send('erro ao listar produtos.');
    }
};

    exports.ValidarEstoque = async (req, res) => {
        try {
            console.log('ValidarEstoque chamada com body:', req.body);
            const { id, quantidade } = req.body;

            const sql = 'SELECT estoque, titulo FROM produtos WHERE id = ?';
            const [linhas] = await pool.query(sql, [id]);

            console.log('Linhas retornadas:', linhas);

            if (linhas.length === 0) {
                return res.status(404).send('produto não encontrado.');
            }

            const produto = linhas[0];
            const EstoqueAtual = produto.estoque;

            console.log(`Estoque atual do produto ${produto.titulo}:`, EstoqueAtual, 'quantidade solicitada:', quantidade);

            if (EstoqueAtual >= quantidade) {
                console.log('Estoque suficiente');
                res.json({ disponivel: true,
                           mensagem: 'Estoque disponível.',
                           estoque_atual: EstoqueAtual 
                        });
            } else {
                console.log('Estoque insuficiente');
                res.status(400).json({
                     disponivel: false,
                     mensagem: `Estoque insuficiente. Restam apenas ${EstoqueAtual} unidades de ${produto.titulo}.`
                });
            }

        } catch (erro) {
            console.error(erro);
            res.status(500).send('erro no estoque.');
        }
    };