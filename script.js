// URL base do json-server
const API = "http://localhost:3000";

// estado local
let users = [];
let catalog = [];
let currentUser = null;
let cart = [];
let selectedProduct = null;
let selectedSize = null;

// --- elementos DOM ---
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
const historyTable = document.getElementById('historyTable');

const loginBtn = document.getElementById('loginBtn');
const goToAdminBtn = document.getElementById('goToAdminBtn');
const goToShopBtn = document.getElementById('goToShopBtn');

const sizeModal = document.getElementById('sizeModal');
const sizeSelect = document.getElementById('sizeSelect');
const confirmSizeBtn = document.getElementById('confirmSizeBtn');
const cancelSizeBtn = document.getElementById('cancelSizeBtn');

// --- funções de API ---
async function fetchAll() {
  try {
    const [pRes, uRes] = await Promise.all([fetch(`${API}/products`), fetch(`${API}/users`)]);
    catalog = await pRes.json();
    users = await uRes.json();
  } catch (err) {
    alert("Erro ao conectar com o servidor. Verifique se o json-server está rodando em http://localhost:3000");
    console.error(err);
  }
}

async function patchProductStock(id, newStockObj) {
  await fetch(`${API}/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stockBySize: newStockObj })
  });
}

async function patchUser(id, payload) {
  await fetch(`${API}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function postPurchase(purchaseObj) {
  const res = await fetch(`${API}/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(purchaseObj)
  });
  return res.json();
}

async function postUser(userObj) {
  const res = await fetch(`${API}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userObj)
  });
  return res.json();
}

// --- UI: mostrar/ocultar seções ---
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
  goToAdminBtn.style.display = (currentUser && currentUser.isAdmin) ? 'inline-block' : 'none';
}

function showAdminPanel() {
  loginSection.style.display = 'none';
  registerSection.style.display = 'none';
  paymentSection.style.display = 'none';
  dashboardSection.style.display = 'none';
  adminSection.style.display = 'block';
  renderAdminTables();
}

// --- render catálogo ---
function renderCatalog() {
  catalogDiv.innerHTML = '';
  catalog.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p>R$ ${product.price.toFixed(2)}</p>
      <button class="btn-primary">Adicionar</button>
    `;
    card.querySelector('img').addEventListener('click', () => openSizeModal(product));
    card.querySelector('button').addEventListener('click', () => {
      alert('Clique na imagem do produto e escolha o tamanho antes de adicionar.');
    });
    catalogDiv.appendChild(card);
  });
}

// abre modal populando opções com disponibilidade
function openSizeModal(product) {
  selectedProduct = product;
  sizeSelect.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '-- Selecione --';
  sizeSelect.appendChild(defaultOpt);

  Object.keys(product.stockBySize).sort((a,b) => a - b).forEach(size => {
    const qty = product.stockBySize[size] || 0;
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = `${size} - ${qty} disponíveis`;
    opt.disabled = qty === 0;
    sizeSelect.appendChild(opt);
  });
  sizeModal.style.display = 'flex';
}

// adiciona ao carrinho considerando tamanho selecionado
async function addToCartWithSize(product, size) {
  if (!currentUser) return alert('Você precisa estar logado.');
  if (product.stockBySize[size] <= 0) return alert('Produto esgotado neste tamanho.');

  const item = cart.find(i => i.product.id === product.id && i.size === size);
  if (item) {
    item.quantity++;
  } else {
    cart.push({ product, size, quantity: 1 });
  }

  product.stockBySize[size]--;
  await patchProductStock(product.id, product.stockBySize);
  updateCartUI();
  sizeModal.style.display = 'none';
  alert(`Adicionado: ${product.name} - tamanho ${size}`);
}

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

function clearCart() {
  cart = [];
  updateCartUI();
}

function resetForms() {
  loginForm.reset();
  registerForm.reset();
  paymentMethod.value = '';
  pixDetails.style.display = 'none';
  cardDetails.style.display = 'none';
}

// --- eventos ---
goToRegister.onclick = () => { loginSection.style.display = 'none'; registerSection.style.display = 'block'; };
goToLogin.onclick = () => { registerSection.style.display = 'none'; loginSection.style.display = 'block'; };
loginBtn.onclick = () => { dashboardSection.style.display = 'none'; loginSection.style.display = 'block'; resetForms(); };
logoutBtn.onclick = adminLogoutBtn.onclick = () => {
  currentUser = null;
  cart = [];
  resetForms();
  showCatalogOnly();
};
goToAdminBtn.onclick = () => { dashboardSection.style.display = 'none'; showAdminPanel(); };
goToShopBtn.onclick = () => { adminSection.style.display = 'none'; showCatalogOnly(); };
viewCartBtn.onclick = () => {
  if (!currentUser) return alert('Faça login.');
  renderCart();
  cartModal.style.display = 'flex';
};
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
confirmPaymentBtn.onclick = async () => {
  if (!paymentMethod.value) return alert('Selecione um método.');
  const purchaseHistory = await fetch(`${API}/purchases`).then(res => res.json());
  purchaseHistory.push({
    userEmail: currentUser.email,
    items: cart.map(item => ({ name: item.product.name, price: item.product.price, quantity: item.quantity, size: item.size })),
    total: cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    date: new Date().toLocaleString()
  });
  await fetch(`${API}/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(purchaseHistory[purchaseHistory.length - 1])
  });
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
  const email = loginForm.loginEmail.value.trim();
  const password = loginForm.loginPassword.value.trim();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return alert('Credenciais inválidas.');
  if (!user.active) return alert('Conta desativada.');
  currentUser = user;
  resetForms();
  user.isAdmin ? showAdminPanel() : showCatalogOnly();
};
registerForm.onsubmit = async e => {
  e.preventDefault();
  const name = registerForm.regName.value.trim();
  const email = registerForm.regEmail.value.trim();
  const password = registerForm.regPassword.value;
  const confirm = registerForm.regPasswordConfirm.value;
  if (password !== confirm) return alert('Senhas diferentes.');
  if (users.find(u => u.email === email)) return alert('Email já cadastrado.');
  const newUser = { name, email, password, active: true, isAdmin: false };
  await postUser(newUser);
  users.push(newUser);
  alert('Cadastro realizado com sucesso!');
  registerSection.style.display = 'none';
  loginSection.style.display = 'block';
  resetForms();
};

// tamanho modal
confirmSizeBtn.onclick = () => {
  selectedSize = sizeSelect.value;
  if (!selectedSize) return alert('Selecione um tamanho.');
  addToCartWithSize(selectedProduct, selectedSize);
};
cancelSizeBtn.onclick = () => {
  selectedProduct = null;
  selectedSize = null;
  sizeModal.style.display = 'none';
};

// inicialização
(async () => {
  await fetchAll();
  showCatalogOnly();
})();
