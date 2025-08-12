const produtos = [
    {nome: 'Carrinho', preco: 'R$100'},
    {nome: 'Bola', preco: 'R$30'},
    {nome: 'Urso', preco: 'R$70'}
 ];
 
 const loja = document.getElementById('loja');
 produtos.forEach(produtos => {
     const div =  document.createElement('div');
     div.innerHTML = `<h3>${produtos.nome}</h3><p>${produtos.preco}</p>`;
     const botao = document.createElement('button');
     botao.innerText= 'Comprar';
     botao.onclick = () => alert(`Você comprou: ${produtos.nome}`);
     div.appendChild(botao);
     loja.appendChild(div);
 });