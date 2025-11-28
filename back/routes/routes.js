const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const pedidoController = require('../controllers/pedidoController');

router.get('/importar', produtoController.importarProdutosFakeStore);
router.get('/produtos', produtoController.listarProdutos);
router.post('/validar-estoque', produtoController.ValidarEstoque);
router.post('/pedidos', pedidoController.criarPedido);
router.get('/minhas-compras', pedidoController.listarMinhasCompras);


module.exports = router;