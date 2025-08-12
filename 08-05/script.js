//const produto = document.createElement('div');
//produto.innerHTML = "<h2>Car</h2><p>Preço: R$50,000</p>";
//document.getElementById('produto').appendChild(produto);

const produtos = [
   {nome: 'Carrinho', preco: 'R$100'},
   {nome: 'Bola', preco: 'R$30'},
   {nome: 'Urso', preco: 'R$70'},
];

const container = document.getElementById('produtos');
produtos.forEach(produtos => {
    const div =  document.createElement('div');
    div.innerHTML = `<h3>${produtos.nome}</h3><p>${produtos.preco}</p>`;
    container.appendChild(div);
});