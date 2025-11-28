const pool = require ('../../db');

exports.criarPedido = async (req, res) => {
    const connection  = await pool.getConnection();
    try{
        const { cliente, itens } = req.body;
        await connection.beginTransaction(); 

        for (const item of itens) { 
            const [rows] = await connection.query('SELECT * FROM produtos WHERE id = ?', [item.produto_id]);
            const produto = rows[0];

            console.log('Tentando comprar item:', item);
            console.log('Produto encontrado no banco:', produto);

            if (!produto) {
                throw new Error(`Produto com ID ${item.produto_id} não encontrado no banco.`);
            }

            if (!produto || produto.estoque < item.quantidade) {
                throw new Error(`Estoque insuficiente para o produto ${produto ? produto.titulo : item.produto_id}`);
            }
        }
        
        let totalPedido = 0;
        for (const item of itens) {
            totalPedido += item.preco * item.quantidade;
        }
        
        const [resultCliente] = await connection.query(
            'INSERT INTO clientes (nome, email) VALUES (?, ?)',
            [cliente.nome, cliente.email]
        );
        const clienteId = resultCliente.insertId;

        const [resultPedido] = await connection.query(
            'INSERT INTO pedidos (cliente_id, valor_total) VALUES (?, ?)',
            [clienteId, totalPedido]
        );
        const pedidoId = resultPedido.insertId;

        for (const item of itens) {
            await connection.query(
                'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
                [pedidoId, item.produto_id, item.quantidade, item.preco]
            );

            console.log(`--- TENTANDO BAIXAR ESTOQUE ---`);
            console.log(`Produto ID: ${item.produto_id}`);
            console.log(`Quantidade a baixar: ${item.quantidade}`);

            const [resultadoUpdate] = await connection.query(
                'UPDATE produtos SET estoque = estoque - ? WHERE id = ?',
                [Number(item.quantidade), item.produto_id]
            );

            console.log(`Linhas afetadas no banco: ${resultadoUpdate.affectedRows}`);
            
            if (resultadoUpdate.affectedRows === 0) {
                console.error(`ERRO GRAVE: O produto ID ${item.produto_id} não foi atualizado, Verifique se o ID existe.`);
                throw new Error(`Falha ao atualizar estoque do produto ${item.produto_id}`);
            }
        }

        await connection.commit();
        console.log('TRANSAÇÃO EFETIVADA (COMMIT)');
        
        res.json({ 
            sucesso: true, 
            pedidoId: pedidoId, 
            mensagem: `Pedido #${pedidoId} realizado com sucesso` 
        });

    } catch (erro) {
        await connection.rollback(); 
        console.error(erro);
        res.status(400).json({ erro: erro.message  || 'erro ao criar pedido.' });
    
    } finally {
        connection.release();
    }
};

exports.listarMinhasCompras = async (req, res) => {
    try {
        const { email } = req.query; 

        if (!email) {
            return res.status(400).json({ erro: 'E-mail é obrigatório' });
        }

        const sql = `
            SELECT 
                p.id, 
                p.data_pedido, 
                p.valor_total,
                GROUP_CONCAT(CONCAT(ip.quantidade, 'x ', prod.titulo) SEPARATOR ', ') as itens_nomes
            FROM pedidos p
            JOIN clientes c ON p.cliente_id = c.id
            JOIN itens_pedido ip ON p.id = ip.pedido_id
            JOIN produtos prod ON ip.produto_id = prod.id
            WHERE c.email = ?
            GROUP BY p.id
            ORDER BY p.data_pedido DESC
        `;

        const [pedidos] = await pool.query(sql, [email]);
        res.json(pedidos);

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar pedidos' });
    }
};
