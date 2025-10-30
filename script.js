// script.js - versão pronta para backend Node/Express + MySQL
// Ajuste a URL abaixo para a do seu backend
const API = "https://shoe-jtqx.onrender.com"; // <- troque aqui para a URL do seu backend

// Estado da aplicação
const state = {
  users: [],
  catalog: [],
  purchases: [],
  currentUser: null,
  cart: [],
  selectedProduct: null,
  selectedSize: null
};

// Cache de elementos DOM (podem ser nulos em páginas específicas)
const elements = {
  loginSection: document.getElementById('login-section'),
  registerSection: document.getElementById('register-section'),
  dashboardSection: document.getElementById('dashboard-section'),
  adminSection: document.getElementById('admin-section'),
  paymentSection: document.getElementById('payment-section'),
  catalogDiv: document.getElementById('catalog'),
  cartCount: document.getElementById('cartCount'),
  cartModal: document.getElementById('cartModal'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  customerName: document.getElementById('customerName'),
  paymentTotal: document.getElementById('paymentTotal'),
  registerForm: document.getElementById('registerForm'),
  loginForm: document.getElementById('loginForm'),
  paymentForm: document.getElementById('paymentForm'),
  goToRegister: document.getElementById('goToRegister'),
  goToLogin: document.getElementById('goToLogin'),
  viewCartBtn: document.getElementById('viewCartBtn'),
  closeCartBtn: document.getElementById('closeCartBtn'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  confirmPaymentBtn: document.getElementById('confirmPaymentBtn'),
  backToShopBtn: document.getElementById('backToShopBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  adminLogoutBtn: document.getElementById('adminLogoutBtn'),
  paymentMethod: document.getElementById('paymentMethod'),
  loginBtn: document.getElementById('loginBtn'),
  goToAdminBtn: document.getElementById('goToAdminBtn'),
  goToShopBtn: document.getElementById('goToShopBtn'),
  sizeModal: document.getElementById('sizeModal'),
  sizeSelect: document.getElementById('sizeSelect'),
  confirmSizeBtn: document.getElementById('confirmSizeBtn'),
  cancelSizeBtn: document.getElementById('cancelSizeBtn'),
  pixDetails: document.getElementById('pixDetails'),
  cardDetails: document.getElementById('cardDetails'),
  userTable: document.getElementById('userTable'),
  historyTable: document.getElementById('historyTable'),
  stockTable: document.getElementById('stockTable')
};

const settingsSection = document.getElementById('user-settings-section');
const settingsForm = document.getElementById('user-settings-form');
const openSettingsBtn = document.getElementById('open-settings-btn');
const backToCatalogBtn = document.getElementById('back-to-catalog');

// =======================
// Utilitários
// =======================
function showError(message) {
  // aqui você pode trocar por modal / toast
  alert(`Erro: ${message}`);
}

function showSuccess(message) {
  alert(`Sucesso: ${message}`);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function resetForms() {
  if (elements.loginForm) elements.loginForm.reset();
  if (elements.registerForm) elements.registerForm.reset();
  if (elements.paymentForm) elements.paymentForm.reset();
  if (elements.paymentMethod) elements.paymentMethod.value = '';
  if (elements.pixDetails) elements.pixDetails.style.display = 'none';
  if (elements.cardDetails) elements.cardDetails.style.display = 'none';
}

// =======================
// API helpers
// =======================
async function apiGet(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API GET ${path} falhou`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res;
}

async function apiPatch(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res;
}

// =======================
// 1️⃣ Carregar dados do backend
// =======================
async function fetchData() {
  try {
    // buscar users, products e purchases do backend
    const [users, products, purchases] = await Promise.all([
      apiGet('/users'),
      apiGet('/products'),
      apiGet('/purchases')
    ]);

    state.users = users;
    state.catalog = products;
    state.purchases = purchases;

    // registra event listeners e inicialização
    setupEventListeners();

    // mostra seção de login (se existir) por padrão
    if (elements.loginSection) showSection(elements.loginSection);

    // configura botões de configurações
    if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => {
      if (!state.currentUser) return showError('Faça login.');
      const nameInput = document.getElementById('userName');
      if (nameInput) nameInput.value = state.currentUser.name;
      showSection(settingsSection);
    });

    if (backToCatalogBtn) backToCatalogBtn.addEventListener('click', showCatalogOnly);

    if (settingsForm) settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.currentUser) return showError('Faça login.');
      const name = document.getElementById('userName').value.trim();
      const password = document.getElementById('userPassword').value;
      try {
        const patchBody = {};
        if (name) patchBody.name = name;
        if (password) patchBody.password = password;
        const res = await apiPatch(`/users/${state.currentUser.id}`, patchBody);
        if (!res.ok) throw new Error('Falha ao atualizar usuário');
        // atualiza localmente
        state.currentUser.name = name || state.currentUser.name;
        localStorage.setItem('currentUser', JSON.stringify({
          id: state.currentUser.id,
          email: state.currentUser.email,
          name: state.currentUser.name,
          isAdmin: state.currentUser.isAdmin,
          active: state.currentUser.active
        }));
        showSuccess('Configurações atualizadas.');
        showCatalogOnly();
      } catch (err) {
        console.error(err);
        showError('Erro ao atualizar configurações.');
      }
    });

    // Verifica se existe usuário logado no localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // encontra na lista de users (para obter id, isAdmin, active atualizados)
      const user = state.users.find(u => u.email === userData.email);
      if (user && user.active) {
        state.currentUser = user;
        updateUIForUser();
        renderCatalog();
        showSuccess(`Bem-vindo(a) de volta, ${user.name}!`);
      } else {
        // se user não existe mais ou foi desativado, limpa localStorage
        localStorage.removeItem('currentUser');
      }
    }

    // Atualiza carrinho UI inicial
    updateCartUI();
  } catch (error) {
    console.error("Erro fetchData:", error);
    showError("Não foi possível carregar os dados da loja!");
  }
}

// =======================
// 2️⃣ Autenticação (login / registro) - agora via backend
// =======================
async function handleLogin(e) {
  e.preventDefault();
  if (!elements.loginForm) return;
  const email = elements.loginForm.loginEmail.value.trim();
  const password = elements.loginForm.loginPassword.value.trim();
  if (!email || !password) return showError('Preencha email e senha.');

  try {
    const res = await apiPost('/login', { email, password });
    const data = await res.json();
    if (!res.ok) {
      return showError(data.error || 'Erro ao logar.');
    }
    // resposta contém id, name, email, isAdmin, active
    state.currentUser = data;
    localStorage.setItem('currentUser', JSON.stringify({
      id: data.id,
      email: data.email,
      name: data.name,
      isAdmin: data.isAdmin,
      active: data.active
    }));
    showSuccess(`Bem-vindo(a), ${data.name}!`);
    resetForms();
    showCatalogOnly();
  } catch (err) {
    console.error(err);
    showError('Erro ao conectar com o servidor.');
  }
}

async function handleRegistration(e) {
  e.preventDefault();
  if (!elements.registerForm) return;
  const name = elements.registerForm.regName.value.trim();
  const email = elements.registerForm.regEmail.value.trim();
  const password = elements.registerForm.regPassword.value;
  const confirmPassword = elements.registerForm.regPasswordConfirm.value;

  if (!name || !email || !password || !confirmPassword) return showError("Preencha todos os campos.");
  if (password !== confirmPassword) return showError("Senhas não coincidem.");
  if (password.length < 6) return showError("A senha deve ter pelo menos 6 caracteres.");

  try {
    const res = await apiPost('/register', { name, email, password });
    const data = await res.json();
    if (!res.ok) {
      return showError(data.error || 'Erro ao registrar usuário.');
    }
    showSuccess('Cadastro realizado com sucesso! Faça login.');
    resetForms();
    showSection(elements.loginSection);
    // opcional: atualizar lista de users localmente (se admin estiver logado)
    const newUserRow = { id: data.id, name: data.name, email: data.email, active: true, isAdmin: false };
    state.users.push(newUserRow);
  } catch (err) {
    console.error(err);
    showError('Erro ao conectar com o servidor.');
  }
}

// =======================
// 3️⃣ UI e navegação
// =======================
function showSection(section) {
  [elements.loginSection, elements.registerSection, elements.dashboardSection, elements.adminSection, elements.paymentSection, settingsSection].forEach(sec => {
    if (sec) sec.style.display = 'none';
  });
  if (section) section.style.display = 'block';
  updateUIForUser();
}

function updateUIForUser() {
  const { currentUser } = state;
  if (elements.loginBtn) elements.loginBtn.style.display = currentUser ? 'none' : 'inline-block';
  if (elements.logoutBtn) elements.logoutBtn.style.display = currentUser ? 'inline-block' : 'none';
  if (elements.goToAdminBtn) elements.goToAdminBtn.style.display = (currentUser && currentUser.isAdmin) ? 'inline-block' : 'none';
  if (openSettingsBtn) openSettingsBtn.style.display = state.currentUser ? 'inline-block' : 'none';
}

function showCatalogOnly() {
  showSection(elements.dashboardSection);
  renderCatalog();
  updateCartUI();

  // mensagem se não estiver logado
  if (!state.currentUser && elements.catalogDiv) {
    const existingMessage = elements.catalogDiv.querySelector('.login-required-message');
    if (!existingMessage) {
      const div = document.createElement('div');
      div.className = 'login-required-message';
      div.innerHTML = `
        <h3>Faça login para adicionar produtos ao carrinho</h3>
        <button class="btn-primary" id="promptLoginBtn">Fazer Login</button>
      `;
      elements.catalogDiv.appendChild(div);
      const btn = document.getElementById('promptLoginBtn');
      if (btn) btn.addEventListener('click', () => showSection(elements.loginSection));
    }
  }
}

function showAdminPanel() {
  showSection(elements.adminSection);
  renderAdminTables();
}

// =======================
// 4️⃣ Catálogo, modal de tamanho e carrinho
// =======================
function renderCatalog() {
  if (!elements.catalogDiv) return;
  elements.catalogDiv.innerHTML = '';

  state.catalog.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product';
    const buttonHtml = state.currentUser
      ? `<button class="btn-primary">Adicionar</button>`
      : `<button class="btn-disabled" disabled>Faça login para comprar</button>`;

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p>${formatCurrency(product.price)}</p>
      ${buttonHtml}
    `;

    // listeners
    const imgEl = card.querySelector('img');
    const btnEl = card.querySelector('button');

    if (imgEl) {
      imgEl.addEventListener('click', () => {
        if (!state.currentUser) {
          showError('Faça login para visualizar os tamanhos disponíveis.');
          showSection(elements.loginSection);
          return;
        }
        openSizeModal(product);
      });
    }

    if (btnEl) {
      btnEl.addEventListener('click', () => {
        if (!state.currentUser) {
          showError('Faça login para adicionar produtos ao carrinho.');
          showSection(elements.loginSection);
          return;
        }
        openSizeModal(product);
      });
    }

    elements.catalogDiv.appendChild(card);
  });
}

function openSizeModal(product) {
  state.selectedProduct = product;
  if (!elements.sizeSelect || !elements.sizeModal) return;

  elements.sizeSelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Selecione --';
  elements.sizeSelect.appendChild(defaultOption);

  // garante ordem numérica dos tamanhos
  const sizes = Object.keys(product.stockBySize || {}).map(Number).sort((a, b) => a - b);

  sizes.forEach(size => {
    const quantity = product.stockBySize[size] || 0;
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `${size} - ${quantity} disponível${quantity !== 1 ? 's' : ''}`;
    option.disabled = quantity === 0;
    elements.sizeSelect.appendChild(option);
  });

  elements.sizeModal.style.display = 'flex';
}

function addToCartWithSize(product, size) {
  if (!state.currentUser) {
    showError('Você precisa estar logado para adicionar itens ao carrinho.');
    return;
  }

  if (!product.stockBySize || (product.stockBySize[size] <= 0)) {
    showError('Produto esgotado neste tamanho.');
    return;
  }

  const existingItem = state.cart.find(item => item.product.id === product.id && item.size == size);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    state.cart.push({
      product: { ...product },
      size,
      quantity: 1
    });
  }

  // Atualiza estoque localmente para refletir adição imediata
  const prod = state.catalog.find(p => p.id === product.id);
  if (prod) {
    prod.stockBySize[size] = (prod.stockBySize[size] || 0) - 1;
  }

  updateCartUI();
  if (elements.sizeModal) elements.sizeModal.style.display = 'none';
  showSuccess(`${product.name} - tamanho ${size} adicionado ao carrinho!`);
}

function renderCart() {
  if (!elements.cartItems) return;
  elements.cartItems.innerHTML = '';

  if (state.cart.length === 0) {
    elements.cartItems.innerHTML = '<li class="empty-cart">Seu carrinho está vazio.</li>';
    if (elements.cartTotal) elements.cartTotal.textContent = '0.00';
    return;
  }

  let total = 0;
  state.cart.forEach(({ product, quantity, size }, index) => {
    const itemTotal = product.price * quantity;
    total += itemTotal;

    const li = document.createElement('li');
    li.innerHTML = `
      <div class="cart-item">
        <span class="item-name">${product.name} (tamanho ${size})</span>
        <span class="item-quantity">x${quantity}</span>
        <span class="item-price">${formatCurrency(itemTotal)}</span>
        <button class="remove-item" data-index="${index}">✕</button>
      </div>
    `;
    elements.cartItems.appendChild(li);
  });

  if (elements.cartTotal) elements.cartTotal.textContent = formatCurrency(total);

  // listeners remover
  elements.cartItems.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeFromCart(index);
    });
  });
}

function removeFromCart(index) {
  if (index >= 0 && index < state.cart.length) {
    const item = state.cart[index];
    // restaura estoque localmente
    const prod = state.catalog.find(p => p.id === item.product.id);
    if (prod) {
      prod.stockBySize[item.size] = (prod.stockBySize[item.size] || 0) + item.quantity;
    }
    state.cart.splice(index, 1);
    renderCart();
    updateCartUI();
    showSuccess('Item removido do carrinho!');
  }
}

function updateCartUI() {
  const itemCount = state.cart.reduce((total, item) => total + item.quantity, 0);
  if (elements.cartCount) elements.cartCount.textContent = itemCount;
}

function clearCart() {
  state.cart = [];
  updateCartUI();
}

function calculateCartTotal() {
  return state.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
}

// =======================
// 5️⃣ Pagamento (via backend)
// =======================
async function processPayment() {
  if (!state.currentUser) return showError('Faça login antes de finalizar a compra.');
  const method = elements.paymentMethod ? elements.paymentMethod.value : null;
  if (!method) return showError('Selecione um método de pagamento.');

  const items = state.cart.map(item => ({
    productId: item.product.id,
    size: item.size,
    quantity: item.quantity,
    price: item.product.price
  }));

  const body = {
    userId: state.currentUser.id,
    items,
    total: calculateCartTotal(),
    paymentMethod: method
  };

  try {
    const res = await apiPost('/purchases', body);
    const data = await res.json();
    if (!res.ok) {
      return showError(data.error || 'Erro ao processar compra.');
    }

    // atualiza histórico local e estoque local
    state.purchases.push({
      userEmail: state.currentUser.email,
      items: items.map(i => ({ name: state.catalog.find(p => p.id === i.productId)?.name || '', ...i })),
      total: body.total,
      date: new Date().toLocaleString('pt-BR'),
      paymentMethod: method
    });

    // após compra, pedir para recarregar catálogo do backend para sincronizar estoques
    try {
      state.catalog = await apiGet('/products');
    } catch (err) {
      console.warn('Falha ao atualizar catálogo após compra (tente recarregar manualmente).', err);
    }

    clearCart();
    showSuccess('Compra realizada com sucesso!');
    // volta ao catálogo ou à página inicial
    showCatalogOnly();
  } catch (err) {
    console.error(err);
    showError('Erro ao conectar com o servidor durante o pagamento.');
  }
}

// =======================
// 6️⃣ Admin: tabelas e ações
// =======================
function renderAdminTables() {
  renderUserTable();
  renderHistoryTable();
  renderStockTable();
}

function renderUserTable() {
  if (!elements.userTable) return;
  const tbody = elements.userTable.querySelector('tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  state.users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.active ? 'Ativo' : 'Inativo'}</td>
      <td>
        <button class="btn-sm ${user.active ? 'btn-danger' : 'btn-success'}" 
                data-action="toggleUser" 
                data-user-id="${user.id}">
          ${user.active ? 'Desativar' : 'Ativar'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="toggleUser"]').forEach(button => {
    button.addEventListener('click', async (e) => {
      const userId = parseInt(e.target.dataset.userId);
      await toggleUserStatus(userId);
    });
  });
}

async function toggleUserStatus(userId) {
  const user = state.users.find(u => u.id === userId);
  if (!user) return;
  try {
    const res = await apiPatch(`/users/${userId}`, { active: !user.active });
    if (!res.ok) throw new Error('Falha ao atualizar usuário');
    user.active = !user.active;
    renderUserTable();
    showSuccess(`Status de ${user.name} atualizado com sucesso.`);
  } catch (err) {
    console.error(err);
    showError('Falha ao atualizar o status do usuário.');
  }
}

function renderHistoryTable() {
  if (!elements.historyTable) return;
  const tbody = elements.historyTable.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // se o backend já trouxe purchases (resumido), usamos state.purchases
  state.purchases.forEach(purchase => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${purchase.userEmail}</td>
      <td>${(purchase.items || []).map(item => `${item.name || ''} (${item.size}) x${item.quantity}`).join(', ')}</td>
      <td>${formatCurrency(purchase.total)}</td>
      <td>${purchase.date}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStockTable() {
  if (!elements.stockTable) return;
  const tbody = elements.stockTable.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  state.catalog.forEach(product => {
    const tr = document.createElement('tr');

    const sizesHtml = [34, 35, 36, 37, 38, 39].map(size => `
      <td>
        <input
          type="number"
          value="${product.stockBySize && product.stockBySize[size] ? product.stockBySize[size] : 0}"
          min="0"
          data-size="${size}"
          data-product-id="${product.id}"
          class="stock-input"
          style="width:60px; text-align:center; padding:5px;"
        />
      </td>
    `).join('');

    tr.innerHTML = `
      <td>${product.name}</td>
      <td><img src="${product.image}" alt="${product.name}" style="width:50px;height:50px;object-fit:cover"></td>
      ${sizesHtml}
      <td>
        <button class="btn-sm btn-primary" data-action="saveStock" data-product-id="${product.id}">Salvar</button>
        <button class="btn-sm btn-secondary" data-action="restock" data-product-id="${product.id}">Reabastecer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="saveStock"]').forEach(button => {
    button.addEventListener('click', async (e) => {
      const productId = e.target.dataset.productId;
      await saveProductStock(productId);
    });
  });

  tbody.querySelectorAll('[data-action="restock"]').forEach(button => {
    button.addEventListener('click', async (e) => {
      const productId = e.target.dataset.productId;
      await restockProduct(productId);
    });
  });
}

async function restockProduct(productId) {
  const product = state.catalog.find(p => p.id == productId);
  if (!product) return;
  const newStock = prompt(`Quantidade para reabastecer ${product.name} em todos os tamanhos:`);
  const quantity = parseInt(newStock);
  if (isNaN(quantity) || quantity <= 0) return showError('Por favor, insira uma quantidade válida.');

  try {
    Object.keys(product.stockBySize || {}).forEach(size => {
      product.stockBySize[size] = (product.stockBySize[size] || 0) + quantity;
    });
    // envia ao backend
    const res = await apiPatch(`/products/${productId}/stock`, { stockBySize: product.stockBySize });
    if (!res.ok) throw new Error('Erro ao reabastecer no servidor');
    showSuccess(`${product.name} reabastecido com sucesso.`);
    // refetch para garantir sincronização
    state.catalog = await apiGet('/products');
    renderStockTable();
  } catch (err) {
    console.error(err);
    showError('Falha ao reabastecer o produto.');
  }
}

async function saveProductStock(productId) {
  const product = state.catalog.find(p => p.id == productId);
  if (!product) return;
  const inputs = document.querySelectorAll(`input[data-product-id="${productId}"]`);
  inputs.forEach(input => {
    const size = input.dataset.size;
    product.stockBySize = product.stockBySize || {};
    product.stockBySize[size] = parseInt(input.value) || 0;
  });

  try {
    const res = await apiPatch(`/products/${productId}/stock`, { stockBySize: product.stockBySize });
    if (!res.ok) throw new Error('Erro ao salvar estoque');
    showSuccess(`Estoque do produto ${product.name} salvo com sucesso.`);
    // refetch catálogo
    state.catalog = await apiGet('/products');
    renderStockTable();
  } catch (err) {
    console.error(err);
    showError('Erro ao salvar estoque.');
  }
}

// =======================
// 7️⃣ Event listeners (unificados)
// =======================
function setupEventListeners() {
  // navegação rápida
  if (elements.goToRegister) elements.goToRegister.addEventListener('click', () => showSection(elements.registerSection));
  if (elements.goToLogin) elements.goToLogin.addEventListener('click', () => showSection(elements.loginSection));
  if (elements.loginBtn) elements.loginBtn.addEventListener('click', () => { showSection(elements.loginSection); resetForms(); });

  // logout
  if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', handleLogout);
  if (elements.adminLogoutBtn) elements.adminLogoutBtn.addEventListener('click', handleLogout);

  // admin/loja
  if (elements.goToAdminBtn) elements.goToAdminBtn.addEventListener('click', showAdminPanel);
  if (elements.goToShopBtn) elements.goToShopBtn.addEventListener('click', showCatalogOnly);

  // carrinho modal
  if (elements.viewCartBtn) elements.viewCartBtn.addEventListener('click', () => {
    if (!state.currentUser) { showError('Faça login para acessar o carrinho.'); return; }
    renderCart();
    if (elements.cartModal) elements.cartModal.style.display = 'flex';
  });
  if (elements.closeCartBtn) elements.closeCartBtn.addEventListener('click', () => { if (elements.cartModal) elements.cartModal.style.display = 'none'; });

  // checkout: se existe seção paymentSection mostramos nela; caso contrário, redirecionamos para compra.html salvando localStorage
  if (elements.checkoutBtn) elements.checkoutBtn.addEventListener('click', () => {
    if (state.cart.length === 0) { showError('Seu carrinho está vazio.'); return; }
    // se existe paymentSection no DOM, mostramos nela
    if (elements.paymentSection) {
      if (elements.customerName) elements.customerName.textContent = state.currentUser ? state.currentUser.name : 'Visitante';
      if (elements.paymentTotal) elements.paymentTotal.textContent = formatCurrency(calculateCartTotal());
      if (elements.cartModal) elements.cartModal.style.display = 'none';
      showSection(elements.paymentSection);
      resetForms();
    } else {
      // salva dados temporariamente e redireciona para compra.html
      localStorage.setItem('purchaseTotal', calculateCartTotal().toFixed(2));
      localStorage.setItem('purchaseItems', JSON.stringify(state.cart));
      window.location.href = 'compra.html';
    }
  });

  if (elements.confirmPaymentBtn) elements.confirmPaymentBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // se estamos em compra.html (sem section), o processPayment também funciona porque usa state.currentUser e state.cart, mas
    // se a compra foi iniciada a partir de outra página (redirecionada), tentamos restaurar o cart de localStorage
    const storedItems = localStorage.getItem('purchaseItems');
    if (storedItems && state.cart.length === 0) {
      try {
        const items = JSON.parse(storedItems);
        state.cart = items;
      } catch (err) {
        console.warn('Erro ao restaurar itens de purchaseItems', err);
      }
    }
    processPayment();
  });

  if (elements.backToShopBtn) elements.backToShopBtn.addEventListener('click', showCatalogOnly);

  if (elements.paymentMethod) elements.paymentMethod.addEventListener('change', () => {
    if (elements.pixDetails) elements.pixDetails.style.display = elements.paymentMethod.value === 'pix' ? 'block' : 'none';
    if (elements.cardDetails) elements.cardDetails.style.display = elements.paymentMethod.value === 'card' ? 'block' : 'none';
  });

  // formulários
  if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
  if (elements.registerForm) elements.registerForm.addEventListener('submit', handleRegistration);

  // modal de tamanhos
  if (elements.confirmSizeBtn) elements.confirmSizeBtn.addEventListener('click', () => {
    const selectedSize = elements.sizeSelect ? elements.sizeSelect.value : null;
    if (!selectedSize) return showError('Selecione um tamanho.');
    if (!state.selectedProduct) return showError('Nenhum produto selecionado.');
    addToCartWithSize(state.selectedProduct, selectedSize);
  });
  if (elements.cancelSizeBtn) elements.cancelSizeBtn.addEventListener('click', () => {
    state.selectedProduct = null;
    if (elements.sizeModal) elements.sizeModal.style.display = 'none';
  });

  // explore button
  const exploreBtn = document.getElementById('exploreBtn');
  if (exploreBtn) exploreBtn.addEventListener('click', () => {
    const ds = document.getElementById('dashboard-section');
    if (ds) ds.scrollIntoView({ behavior: 'smooth' });
  });

  // menu links (se existirem)
  const navSobre = document.getElementById('navSobre');
  const navInicio = document.getElementById('navInicio');
  const navProdutos = document.getElementById('navProdutos');

  if (navSobre) navSobre.addEventListener('click', (e) => { e.preventDefault(); alert('Sobre nós: Somos uma loja especializada em tênis de qualidade!'); });
  if (navInicio) navInicio.addEventListener('click', (e) => { e.preventDefault(); showCatalogOnly(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  if (navProdutos) navProdutos.addEventListener('click', (e) => { e.preventDefault(); showCatalogOnly(); const ds = document.getElementById('dashboard-section'); if (ds) ds.scrollIntoView({ behavior: 'smooth' }); });

  // botão ir ao admin (página separada)
  const goToAdminBtn = document.getElementById('goToAdminBtn');
  if (goToAdminBtn) goToAdminBtn.addEventListener('click', () => { window.location.href = 'admin.html'; });
}

// =======================
// logout
// =======================
function handleLogout() {
  state.currentUser = null;
  state.cart = [];
  localStorage.removeItem('currentUser');
  localStorage.removeItem('purchaseItems');
  localStorage.removeItem('purchaseTotal');
  resetForms();
  updateUIForUser();
  renderCatalog();
  showCatalogOnly();
  showSuccess('Você saiu da sua conta.');
}

// =======================
// inicialização unica (DOMContentLoaded)
// =======================
document.addEventListener('DOMContentLoaded', () => {
  // inicializa dados
  fetchData();

  // canvas (se existir)
  const canvas = document.getElementById("bgCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    window.addEventListener("resize", () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });

    const particles = [];
    const particleCount = 60;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 2 + Math.random() * 4,
        dx: -0.5 + Math.random(),
        dy: -0.5 + Math.random(),
        color: `rgba(${121}, ${40}, ${202}, ${0.2 + Math.random() * 0.3})`
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, false);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      requestAnimationFrame(animate);
    }
    animate();
  }

  // Quando for compra.html (página separada), restaura valores vindos do localStorage
  const storedTotal = localStorage.getItem('purchaseTotal');
  const storedItems = localStorage.getItem('purchaseItems');
  const customerNameEl = document.getElementById('customerName');
  const paymentTotalEl = document.getElementById('paymentTotal');
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (user && customerNameEl) customerNameEl.textContent = user.name;
  if (paymentTotalEl && storedTotal) paymentTotalEl.textContent = formatCurrency(parseFloat(storedTotal));

  // caso exista paymentMethod select, adiciona listener para mostrar detalhes
  const paymentMethod = document.getElementById('paymentMethod');
  const pixDetails = document.getElementById('pixDetails');
  const cardDetails = document.getElementById('cardDetails');
  if (paymentMethod) {
    paymentMethod.addEventListener('change', () => {
      if (pixDetails) pixDetails.style.display = paymentMethod.value === 'pix' ? 'block' : 'none';
      if (cardDetails) cardDetails.style.display = paymentMethod.value === 'card' ? 'block' : 'none';
    });
  }

  // confirma pagamento (se existir botão em compra.html isolada)
  const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // restaura cart caso venha de redirecionamento
      if (storedItems && state.cart.length === 0) {
        try {
          state.cart = JSON.parse(storedItems);
        } catch (err) {
          console.warn('Erro ao restaurar purchaseItems', err);
        }
      }
      processPayment();
      localStorage.removeItem('purchaseItems');
      localStorage.removeItem('purchaseTotal');
    });
  }
});
 
//nova funçao



function flyToCart(imgElement) {
  const cartBtn = document.querySelector('.cart-btn');
  if (!cartBtn) return;

  // Cria uma cópia da imagem do produto
  const flyImg = imgElement.cloneNode(true);
  flyImg.classList.add('fly-image');
  document.body.appendChild(flyImg);

  // Pega posição inicial da imagem
  const imgRect = imgElement.getBoundingClientRect();
  flyImg.style.top = imgRect.top + 'px';
  flyImg.style.left = imgRect.left + 'px';

  // Pega posição do carrinho
  const cartRect = cartBtn.getBoundingClientRect();
  const translateX = cartRect.left - imgRect.left;
  const translateY = cartRect.top - imgRect.top;

  // Trigger animação
  requestAnimationFrame(() => {
    flyImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.2)`;
    flyImg.style.opacity = 0;
  });

  // Remove a imagem após a animação
  flyImg.addEventListener('transitionend', () => {
    flyImg.remove();
  });
}

// Exemplo: Adicionar evento aos botões do catálogo
document.querySelectorAll('.product .btn-primary').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const img = e.target.closest('.product').querySelector('img');
    flyToCart(img);
  });
});
