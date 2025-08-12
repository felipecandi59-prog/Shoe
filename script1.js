// Declarações iniciais
let users = JSON.parse(localStorage.getItem('users')) || [];
let catalog = JSON.parse(localStorage.getItem('catalog')) || [
  {
    id: 1,
    name: 'Salto',
    price: 199.90,
    image: 'salto.webp',
    stockBySize: { '34': 5, '35': 3, '36': 8, '37': 6, '38': 2, '39': 1 }
  },
  {
    id: 2,
    name: 'Salto',
    price: 149.90,
    image: 'salto.jpg.jpg',
    stockBySize: { '34': 2, '35': 4, '36': 7, '37': 3, '38': 5, '39': 6 }
  },
  {
    id: 3,
    name: 'Sandália',
    price: 179.90,
    image: 'san.webp',
    stockBySize: { '34': 1, '35': 1, '36': 2, '37': 2, '38': 0, '39': 0 }
  }
];
let currentUser = null;
let cart = [];
let selectedProduct = null;
let selectedSize = null;

// DOM Elements (todos os IDs devem existir no HTML)
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const dashboardSection = document.getElementById('dashboard-section');
const adminSection = document.getElementById('admin-section');
const paymentSection = document.getElementById('payment-section');

const catalogDiv = document.getElementById('catalog');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const customerName = document.getElementById('customerName');
const paymentTotal = document.getElementById('paymentTotal');
const pixDetails = document.getElementById('pixDetails');
const cardDetails = document.getElementById('cardDetails');

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const goToRegister = document.getElementById('goToRegister');
const goToLogin = document.getElementById('goToLogin');
const viewCartBtn = document.getElementById('viewCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const backToShopBtn = document.getElementById('backToShopBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const paymentMethod = document.getElementById('paymentMethod');
const userTable = document.getElementById('userTable');

const regName = document.getElementById('regName');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const regPasswordConfirm = document.getElementById('regPasswordConfirm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');

const loginBtn = document.getElementById('loginBtn');
const goToAdminBtn = document.getElementById('goToAdminBtn');
const goToShopBtn = document.getElementById('goToShopBtn');

// Exibe catálogo
function showCatalogOnly() {
  loginSection.style.display = 'none';
  registerSection.style.display = 'none';
  paymentSection.style.display = 'none';
  adminSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  renderCatalog();
  updateCartUI();

  loginBtn.style.display = currentUser ? 'none' : 'inline-block';
  logoutBtn.style.display = currentUser ? 'inline-block' : 'none';
  goToAdminBtn.style.display = (currentUser && currentUser.email === 'admin@admin.com') ? 'inline-block' : 'none';
}

// Exibe painel do admin
function showAdminPanel() {
  loginSection.style.display = 'none';
  registerSection.style.display = 'none';
  paymentSection.style.display = 'none';
  dashboardSection.style.display = 'none';
  adminSection.style.display = 'block';

  // Usuários
  const tbody = userTable.querySelector('tbody');
  tbody.innerHTML = '';
  users.forEach((u, index) => {
    if (u.email === 'admin@admin.com') return;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.active ? 'Ativo' : 'Desativado'}</td>
      <td><button class="toggle-status-btn">${u.active ? 'Desativar' : 'Ativar'}</button></td>
    `;
    row.querySelector('button').onclick = () => {
      users[index].active = !users[index].active;
      localStorage.setItem('users', JSON.stringify(users));
      showAdminPanel();
    };
    tbody.appendChild(row);
  });

  // Estoque
  const stockTableBody = document.querySelector('#stockTable tbody');
  stockTableBody.innerHTML = '';
  catalog.forEach((product, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.name}</td>
      <td><img src="${product.image}" style="width: 50px; height: 50px;" /></td>
      ${['34','35','36','37','38','39'].map(size => `
        <td><input type="number" min="0" value="${product.stockBySize[size] || 0}" data-size="${size}" data-index="${index}" /></td>
      `).join('')}
      <td><button class="saveStockBtn" data-index="${index}">Salvar</button></td>
    `;
    stockTableBody.appendChild(row);
  });

  document.querySelectorAll('.saveStockBtn').forEach(button => {
    button.onclick = () => {
      const index = button.getAttribute('data-index');
      const inputs = stockTableBody.querySelectorAll(`input[data-index="${index}"]`);
      inputs.forEach(input => {
        const size = input.getAttribute('data-size');
        catalog[index].stockBySize[size] = parseInt(input.value, 10) || 0;
      });
      localStorage.setItem('catalog', JSON.stringify(catalog));
      alert('Estoque atualizado com sucesso.');
    };
  });

  // Histórico de compras
  const historyTable = document.getElementById('historyTable').querySelector('tbody');
  historyTable.innerHTML = '';
  const purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  purchaseHistory.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.userEmail}</td>
      <td>${entry.items.map(item => `${item.name} x${item.quantity} (tamanho ${item.size || '-'})`).join('<br>')}</td>
      <td>R$ ${entry.total.toFixed(2)}</td>
      <td>${entry.date}</td>
    `;
    historyTable.appendChild(row);
  });
}

// Renderiza catálogo
function renderCatalog() {
  catalogDiv.innerHTML = '';
  catalog.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; cursor: pointer;" />
      <h3>${product.name}</h3>
      <p>R$ ${product.price.toFixed(2)}</p>
      <button class="btn-primary">Adicionar ao Carrinho</button>
    `;
    div.querySelector('img').onclick = () => {
      selectedProduct = product;
      selectedSize = null;
      document.getElementById('sizeSelect').value = '';
      document.getElementById('sizeModal').style.display = 'flex';
    };
    div.querySelector('button').onclick = () => {
      if (selectedProduct?.id === product.id && selectedSize) {
        addToCartWithSize(product, selectedSize);
      } else {
        alert('Clique na imagem e selecione um tamanho primeiro.');
      }
    };
    catalogDiv.appendChild(div);
  });
}

// Adiciona com tamanho
function addToCartWithSize(product, size) {
  if (!currentUser) return alert('Você precisa estar logado.');
  if (product.stockBySize[size] <= 0) return alert('Produto esgotado neste tamanho.');

  const item = cart.find(i => i.product.id === product.id && i.size === size);
  item ? item.quantity++ : cart.push({ product, size, quantity: 1 });

  product.stockBySize[size]--;
  localStorage.setItem('catalog', JSON.stringify(catalog));
  updateCartUI();
  document.getElementById('sizeModal').style.display = 'none';
  alert(`Adicionado: ${product.name} - tamanho ${size}`);
}

// Renderiza carrinho
function renderCart() {
  cartItems.innerHTML = '';
  if (cart.length === 0) return cartItems.innerHTML = '<li>Seu carrinho está vazio.</li>';

  let total = 0;
  cart.forEach(({ product, quantity, size }) => {
    total += product.price * quantity;
    cartItems.innerHTML += `<li>${product.name} (tamanho ${size}) x${quantity} - R$ ${(product.price * quantity).toFixed(2)}</li>`;
  });
  cartTotal.textContent = total.toFixed(2);
}

function updateCartUI() {
  cartCount.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
}
function clearCart() { cart = []; updateCartUI(); }
function resetForms() {
  loginForm.reset();
  registerForm.reset();
  paymentMethod.value = '';
  pixDetails.style.display = 'none';
  cardDetails.style.display = 'none';
}

// Eventos
goToRegister.onclick = () => { loginSection.style.display = 'none'; registerSection.style.display = 'block'; };
goToLogin.onclick = () => { registerSection.style.display = 'none'; loginSection.style.display = 'block'; };
loginBtn.onclick = () => { dashboardSection.style.display = 'none'; loginSection.style.display = 'block'; resetForms(); };
logoutBtn.onclick = adminLogoutBtn.onclick = () => { currentUser = null; cart = []; resetForms(); showCatalogOnly(); };
goToAdminBtn.onclick = () => { dashboardSection.style.display = 'none'; showAdminPanel(); };
goToShopBtn.onclick = () => { adminSection.style.display = 'none'; showCatalogOnly(); };
viewCartBtn.onclick = () => { if (!currentUser) return alert('Faça login.'); renderCart(); cartModal.style.display = 'block'; };
closeCartBtn.onclick = () => { cartModal.style.display = 'none'; };
checkoutBtn.onclick = () => {
  if (!cart.length) return alert('Carrinho vazio.');
  customerName.textContent = currentUser.name;
  paymentTotal.textContent = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2);
  cartModal.style.display = 'none';
  dashboardSection.style.display = 'none';
  paymentSection.style.display = 'block';
  resetForms();
};
confirmPaymentBtn.onclick = () => {
  if (!paymentMethod.value) return alert('Selecione um método.');
  const purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  purchaseHistory.push({
    userEmail: currentUser.email,
    items: cart.map(item => ({ name: item.product.name, price: item.product.price, quantity: item.quantity, size: item.size })),
    total: cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    date: new Date().toLocaleString()
  });
  localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
  alert('Compra realizada com sucesso!');
  clearCart();
  paymentSection.style.display = 'none';
  showCatalogOnly();
};
backToShopBtn.onclick = () => { paymentSection.style.display = 'none'; showCatalogOnly(); };
paymentMethod.onchange = () => {
  pixDetails.style.display = paymentMethod.value === 'pix' ? 'block' : 'none';
  cardDetails.style.display = paymentMethod.value === 'card' ? 'block' : 'none';
};
loginForm.onsubmit = e => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return alert('Credenciais inválidas.');
  if (!user.active) return alert('Conta desativada.');
  currentUser = user;
  resetForms();
  user.email === 'admin@admin.com' ? showAdminPanel() : showCatalogOnly();
};
registerForm.onsubmit = e => {
  e.preventDefault();
  const name = regName.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value;
  const confirm = regPasswordConfirm.value;
  if (password !== confirm) return alert('Senhas diferentes.');
  if (users.find(u => u.email === email)) return alert('Email já cadastrado.');
  users.push({ name, email, password, active: true });
  localStorage.setItem('users', JSON.stringify(users));
  alert('Cadastro realizado com sucesso!');
  registerSection.style.display = 'none';
  loginSection.style.display = 'block';
  resetForms();
};

// Tamanho (modal)
document.getElementById('confirmSizeBtn').onclick = () => {
  selectedSize = document.getElementById('sizeSelect').value;
  if (!selectedSize) return alert('Selecione um tamanho.');
  addToCartWithSize(selectedProduct, selectedSize);
};
document.getElementById('cancelSizeBtn').onclick = () => {
  selectedProduct = null;
  selectedSize = null;
  document.getElementById('sizeModal').style.display = 'none';
};

// Inicialização
showCatalogOnly();
