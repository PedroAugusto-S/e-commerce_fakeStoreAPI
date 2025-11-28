let listaProdutos = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

atualizarIconeCarrinho();

async function carregarProdutos(filtros = {}) {
    const container = document.getElementById('grade-produtos');
    if (!container) return; 

    container.innerHTML = 'Carregando...';

    try {
        let url = '/api/produtos';
        
        const params = new URLSearchParams();
        
        if (filtros.categoria) {
            params.append('categoria', filtros.categoria);
        }
        if (filtros.busca) {
            params.append('busca', filtros.busca);
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const resposta = await fetch(url);
        listaProdutos = await resposta.json();

        container.innerHTML = '';

        if (listaProdutos.length === 0) {
            container.innerHTML = '<p>Nenhum produto encontrado.</p>';
            return;
        }

        listaProdutos.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <a href="detalhes.html?id=${produto.id}">
                    <img src="${produto.imagem_url}" alt="${produto.titulo}">
                </a>
                <h3>${produto.titulo}</h3>
                <p>${produto.categoria}</p>
                <span class="preco">R$ ${produto.preco}</span>
                <small>Estoque: ${produto.estoque}</small> <br><br>
                <button class="btn-comprar" onclick="adicionarAoCarrinho(${produto.id})">
                    Adicionar
                </button>
            `;
            container.appendChild(card);
        });

    } catch (erro) {
        console.error('Erro:', erro);
        container.innerHTML = '<p>Erro ao carregar produtos.</p>';
    }
}

function buscarPorTexto() {
    const termo = document.getElementById('input-busca').value;
    carregarProdutos({ busca: termo });
}

async function carregarDetalhesProduto() {
    const container = document.getElementById('detalhe-produto');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        container.innerHTML = '<p>Produto não especificado.</p>';
        return;
    }

    try {
        const res = await fetch(`/api/produtos`); 
        const produtos = await res.json();
        const produto = produtos.find(p => p.id == id);

        if (!produto) {
            container.innerHTML = '<p>Produto não encontrado.</p>';
            return;
        }

        document.getElementById('img-detalhe').src = produto.imagem_url;
        document.getElementById('titulo-detalhe').innerText = produto.titulo;
        document.getElementById('desc-detalhe').innerText = produto.descricao || 'Sem descrição';
        document.getElementById('cat-detalhe').innerText = produto.categoria;
        document.getElementById('preco-detalhe').innerText = `R$ ${produto.preco}`;
        document.getElementById('estoque-detalhe').innerText = `Estoque disponível: ${produto.estoque}`;
        
        const btn = document.getElementById('btn-add-detalhe');
        btn.onclick = () => adicionarAoCarrinho(produto.id, produto);

    } catch (erro) {
        console.error(erro);
        container.innerHTML = '<p>Erro ao carregar detalhes.</p>';
    }
}

async function adicionarAoCarrinho(idProduto, produtoObj = null) {
    if (!produtoObj) {
        produtoObj = listaProdutos.find(p => p.id === idProduto);
    }
    
    if (!produtoObj) {
    }

    const itemNoCarrinho = carrinho.find(item => item.id === idProduto);
    let novaQuantidade = 1;

    if (itemNoCarrinho) {
        novaQuantidade = itemNoCarrinho.quantidade + 1;
    }

    try {
        const resposta = await fetch('/api/validar-estoque', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: idProduto, quantidade: novaQuantidade })
        });

        const dados = await resposta.json();

        if (dados.disponivel) {
            if (itemNoCarrinho) {
                itemNoCarrinho.quantidade = novaQuantidade;
            } else {
                carrinho.push({
                    id: idProduto,
                    produto_id: idProduto,
                    titulo: produtoObj.titulo,
                    preco: produtoObj.preco,
                    imagem: produtoObj.imagem_url,
                    quantidade: 1
                });
            }
            salvarCarrinho();
            alert('Produto adicionado!');
        } else {
            alert(dados.mensagem);
        }

    } catch (erro) {
        console.error('Erro na validação:', erro);
        alert('Erro ao conectar com o servidor.');
    }
}

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarIconeCarrinho();
}

function atualizarIconeCarrinho() {
    const contador = document.getElementById('contagem-carrinho');
    if (contador) {
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        contador.innerText = totalItens;
    }
}

function renderizarCarrinho() {
    const tbody = document.getElementById('lista-carrinho');
    const msgVazio = document.getElementById('msg-carrinho-vazio');
    const container = document.getElementById('carrinho-container');

    if (!tbody) return; 

    if (carrinho.length === 0) {
        container.style.display = 'none';
        msgVazio.style.display = 'block';
        return;
    }

    tbody.innerHTML = '';
    let total = 0;

    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${item.imagem}" width="50" style="vertical-align: middle;">
                ${item.titulo}
            </td>
            <td>R$ ${item.preco}</td>
            <td>
                <button class="btn-qty" onclick="alterarQuantidade(${item.id}, -1)">-</button>
                <span>${item.quantidade}</span>
                <button class="btn-qty" onclick="alterarQuantidade(${item.id}, 1)">+</button>
            </td>
            <td>R$ ${subtotal.toFixed(2)}</td>
            <td><button class="btn-remove" onclick="removerItem(${index})">X</button></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('valor-total').innerText = `R$ ${total.toFixed(2)}`;
}

async function alterarQuantidade(idProduto, mudanca) {
    const item = carrinho.find(i => i.id === idProduto);
    if (!item) return;

    const novaQtd = item.quantidade + mudanca;
    if (novaQtd < 1) return;

    if (mudanca > 0) {
        try {
            const res = await fetch('/api/validar-estoque', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idProduto, quantidade: novaQtd })
            });
            const dados = await res.json();
            if (!dados.disponivel) {
                alert(dados.mensagem);
                return;
            }
        } catch (error) { return; }
    }

    item.quantidade = novaQtd;
    salvarCarrinho();
    renderizarCarrinho();
}

function removerItem(index) {
    carrinho.splice(index, 1);
    salvarCarrinho();
    renderizarCarrinho();
}

function atualizarResumoCheckout() {
    const divResumo = document.getElementById('resumo-checkout');
    if (!divResumo) return;

    if (carrinho.length === 0) {
        alert("Carrinho vazio!");
        window.location.href = 'index.html';
        return;
    }
    const total = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    divResumo.innerHTML = `Items: ${carrinho.length} | Total: R$ ${total.toFixed(2)}`;
}

async function finalizarCompra(event) {
    event.preventDefault();
    console.log('Finalizando compra');
    const nome = document.getElementById('cliente-nome').value;
    const email = document.getElementById('cliente-email').value;

    console.log('Nome:', nome, 'Email:', email);
    console.log('Carrinho:', carrinho);

    const pedidoJSON = {
        cliente: { nome, email },
        itens: carrinho.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco: i.preco }))
    };

    console.log('Enviando pedido:', JSON.stringify(pedidoJSON));

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const resposta = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoJSON),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Resposta status:', resposta.status);
        const dados = await resposta.json();
        console.log('Dados da resposta:', dados);

        if (resposta.ok) {
            alert(`✅ Pedido #${dados.pedidoId} realizado com sucesso!`);
            carrinho = [];
            salvarCarrinho();
            window.location.href = 'index.html';
        } else {
            alert('❌ Erro: ' + (dados.erro || 'Erro desconhecido'));
        }
    } catch (erro) {
        console.error('Erro de conexão:', erro);
        if (erro.name === 'AbortError') {
            alert('❌ Timeout: O servidor demorou muito para responder. Tente novamente.');
        } else {
            alert('❌ Erro de conexão ao finalizar pedido: ' + erro.message);
        }
    }
}

async function buscarMeusPedidos(event) {
    event.preventDefault();
    const email = document.getElementById('email-busca').value;
    const container = document.getElementById('lista-pedidos');
    container.innerHTML = 'Buscando...';

    try {

        const res = await fetch(`/api/minhas-compras?email=${email}`);
        const pedidos = await res.json();

        if (pedidos.length === 0) {
            container.innerHTML = '<p>Nenhum pedido encontrado para este e-mail.</p>';
            return;
        }

        container.innerHTML = '';
        pedidos.forEach(p => {
            const div = document.createElement('div');
            div.className = 'pedido-card';
            const data = new Date(p.data_pedido).toLocaleDateString();
            div.innerHTML = `
                <div style="background:#1a1a1a; border: 1px solid #333; padding:15px; margin-bottom:10px; border-radius: 8px;">
                    <strong style="color: #dc143c;">Pedido #${p.id}</strong> <span style="color: #999;">- ${data}</span> <br>
                    <span style="color: #e0e0e0;">Total: R$ ${p.valor_total}</span>
                </div>
                <div style="padding-left: 15px; font-size: 0.9em; color: #ccc; margin-bottom: 15px;">
                    ${p.itens_nomes}
                </div>
            `;
            container.appendChild(div);
        });

    } catch (erro) {
        console.error(erro);
        container.innerHTML = 'Erro ao buscar pedidos.';
    }
}


if (document.getElementById('grade-produtos')) carregarProdutos();
if (document.getElementById('lista-carrinho')) renderizarCarrinho();
if (document.getElementById('resumo-checkout')) atualizarResumoCheckout();
if (document.getElementById('detalhe-produto')) carregarDetalhesProduto();