// URL do JSON no GitHub (somente leitura)
const API = "https://shoe-jtqx.onrender.com";

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

// Cache de elementos DOM
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
// 1️⃣ Carregar dados do GitHub
// =======================
async function fetchData() {
    try {
        // Busca todos os recursos em paralelo
        const [usersRes, productsRes, purchasesRes] = await Promise.all([
            fetch(`${API}/users`),
            fetch(`${API}/products`),
            fetch(`${API}/purchases`)
        ]);

        // Verifica se alguma requisição falhou
        if (!usersRes.ok || !productsRes.ok || !purchasesRes.ok) {
            throw new Error("Erro ao carregar dados do servidor");
        }

        // Transforma as respostas em JSON
        state.users = await usersRes.json();
        state.catalog = await productsRes.json();
        state.purchases = await purchasesRes.json();

        // Continua com o restante do código
        setupEventListeners();
        showCatalogOnly();
 

        if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => {
  if (!state.currentUser) return showError('Faça login.');
  document.getElementById('userName').value = state.currentUser.name;
  showSection(settingsSection);
});

if (backToCatalogBtn) backToCatalogBtn.addEventListener('click', showCatalogOnly);

if (settingsForm) settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('userName').value.trim();
  const password = document.getElementById('userPassword').value;
  try {
    await patchUser(state.currentUser.id, { name, password });
    state.currentUser.name = name;
    if (password) state.currentUser.password = password;
    localStorage.setItem('currentUser', JSON.stringify({
      email: state.currentUser.email,
      name: state.currentUser.name,
      isAdmin: state.currentUser.isAdmin
    }));
    showSuccess('Configurações atualizadas.');
    showCatalogOnly();
  } catch (err) {
    console.error(err);
    showError('Erro ao atualizar configurações.');
  }
});

        // Verifica se existe usuário logado
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            const user = state.users.find(u => u.email === userData.email);
            
            if (user && user.active) {
                state.currentUser = user;
                updateUIForUser();
                renderCatalog();
                showSuccess(`Bem-vindo(a) de volta, ${user.name}!`);
            }
        }

    } catch (error) {
        console.error("Erro:", error);
        showError("Não foi possível carregar os dados da loja!");
    }
}


// =======================
// 2️⃣ Login e registro (somente memória)
// =======================
function handleLogin(e) {
    e.preventDefault();
    const email = elements.loginForm.loginEmail.value.trim();
    const password = elements.loginForm.loginPassword.value.trim();

    const user = state.users.find(u => u.email === email && u.password === password);
    if (!user) return showError("Email ou senha incorretos.");
    if (!user.active) return showError("Usuário inativo.");

    state.currentUser = user;
    
    // Salvar no localStorage
    localStorage.setItem('currentUser', JSON.stringify({
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
    }));
    
    showSuccess(`Bem-vindo(a), ${user.name}!`);
    resetForms();
    showCatalogOnly();
}

function handleRegistration(e) {
    e.preventDefault();
    const name = elements.registerForm.regName.value.trim();
    const email = elements.registerForm.regEmail.value.trim();
    const password = elements.registerForm.regPassword.value;
    const confirmPassword = elements.registerForm.regPasswordConfirm.value;

    if (!name || !email || !password || !confirmPassword) return showError("Preencha todos os campos.");
    if (password !== confirmPassword) return showError("Senhas não coincidem.");
    if (password.length < 6) return showError("A senha deve ter pelo menos 6 caracteres.");
    if (state.users.find(u => u.email === email)) return showError("Email já cadastrado.");

    const newUser = { 
        id: Math.max(...state.users.map(u => u.id), 0) + 1,
        name, 
        email, 
        password, 
        active: true, 
        isAdmin: false 
    };
    
    state.users.push(newUser);
    showSuccess("Cadastro realizado! (Somente temporário)");
    resetForms();
    showSection(elements.loginSection);
}

// =======================
// 3️⃣ UI e navegação
// =======================
function showSection(section) {
    [elements.loginSection, elements.registerSection, elements.dashboardSection, elements.adminSection, elements.paymentSection].forEach(sec => {
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
    if (document.getElementById('open-settings-btn'))
  document.getElementById('open-settings-btn').style.display = state.currentUser ? 'inline-block' : 'none';

}

function showCatalogOnly() {
    showSection(elements.dashboardSection);
    renderCatalog();
    updateCartUI();
    
    // Se não estiver logado, mostrar mensagem
    if (!state.currentUser && elements.catalogDiv) {
        const existingMessage = elements.catalogDiv.querySelector('.login-required-message');
        if (!existingMessage) {
            elements.catalogDiv.innerHTML += `
                <div class="login-required-message">
                    <h3>Faça login para adicionar produtos ao carrinho</h3>
                    <button class="btn-primary" onclick="showSection(elements.loginSection)">Fazer Login</button>
                </div>
            `;
        }
    }
}

function showAdminPanel() {
    showSection(elements.adminSection);
    renderAdminTables();
}

// =======================
// 4️⃣ Catálogo e carrinho
// =======================
function renderCatalog() {
    if (!elements.catalogDiv) return;
    
    elements.catalogDiv.innerHTML = '';
    
    state.catalog.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product';
        
        // Botão diferente baseado no login
        const buttonHtml = state.currentUser 
            ? `<button class="btn-primary">Adicionar</button>`
            : `<button class="btn-disabled" disabled>Faça login para comprar</button>`;
        
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" />
            <h3>${product.name}</h3>
            <p>${formatCurrency(product.price)}</p>
            ${buttonHtml}
        `;
        
        // Só permite clicar na imagem se estiver logado
        if (state.currentUser) {
            card.querySelector('img').addEventListener('click', () => openSizeModal(product));
            card.querySelector('button').addEventListener('click', () => {
                showError('Clique na imagem do produto e escolha o tamanho antes de adicionar.');
            });
        } else {
            card.querySelector('img').addEventListener('click', () => {
                showError('Faça login para visualizar os tamanhos disponíveis.');
                showSection(elements.loginSection);
            });
            card.querySelector('button').addEventListener('click', () => {
                showError('Faça login para adicionar produtos ao carrinho.');
                showSection(elements.loginSection);
            });
        }
        
        elements.catalogDiv.appendChild(card);
    });
}

function openSizeModal(product) {
    state.selectedProduct = product;
    if (!elements.sizeSelect) return;
    
    elements.sizeSelect.innerHTML = '';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Selecione --';
    elements.sizeSelect.appendChild(defaultOption);
    
    // Ordena os tamanhos e cria as opções
    Object.keys(product.stockBySize)
        .sort((a, b) => a - b)
        .forEach(size => {
            const quantity = product.stockBySize[size] || 0;
            const option = document.createElement('option');
            option.value = size;
            option.textContent = `${size} - ${quantity} disponível${quantity !== 1 ? 's' : ''}`;
            option.disabled = quantity === 0;
            elements.sizeSelect.appendChild(option);
        });
    
    if (elements.sizeModal) elements.sizeModal.style.display = 'flex';
}

function addToCartWithSize(product, size) {
    if (!state.currentUser) {
        showError('Você precisa estar logado para adicionar itens ao carrinho.');
        return;
    }
    
    if (product.stockBySize[size] <= 0) {
        showError('Produto esgotado neste tamanho.');
        return;
    }
    
    // Encontra o item no carrinho
    const existingItem = state.cart.find(item => 
        item.product.id === product.id && item.size === size
    );
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.cart.push({ 
            product: { ...product }, 
            size, 
            quantity: 1 
        });
    }
    
    // Atualiza o estoque (apenas localmente)
    const productIndex = state.catalog.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
        state.catalog[productIndex].stockBySize[size]--;
        updateCartUI();
        if (elements.sizeModal) elements.sizeModal.style.display = 'none';
        showSuccess(`${product.name} - tamanho ${size} adicionado ao carrinho!`);
    }
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
    
    // Adiciona event listeners para os botões de remover
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeFromCart(index);
        });
    });
}

function removeFromCart(index) {
    if (index >= 0 && index < state.cart.length) {
        const item = state.cart[index];
        
        // Restaura o estoque (apenas localmente)
        const product = state.catalog.find(p => p.id === item.product.id);
        if (product) {
            product.stockBySize[item.size] += item.quantity;
        }
        
        // Remove do carrinho
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
    return state.cart.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
    }, 0);
}

// =======================
// 5️⃣ Pagamento (simulado)
// =======================
function processPayment() {
    if (!elements.paymentMethod || !elements.paymentMethod.value) {
        showError('Selecione um método de pagamento.');
        return;
    }
    
    const purchase = {
        userEmail: state.currentUser.email,
        userName: state.currentUser.name,
        items: state.cart.map(item => ({
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            size: item.size
        })),
        total: calculateCartTotal(),
        date: new Date().toLocaleString('pt-BR'),
        paymentMethod: elements.paymentMethod.value
    };
    
    state.purchases.push(purchase);
    showSuccess('Compra realizada com sucesso! (Dados salvos apenas localmente)');
    clearCart();
    showCatalogOnly();
}

// =======================
// 6️⃣ Admin (somente leitura)
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
    
    // Adiciona event listeners para os botões
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
        await patchUser(userId, { active: !user.active });
        user.active = !user.active;
        renderUserTable();
        showSuccess(`Status de ${user.name} atualizado com sucesso.`);
    } catch (error) {
        showError('Falha ao atualizar o status do usuário.');
        console.error(error);
    }
}

function renderHistoryTable() {
    if (!elements.historyTable) return;
    
    const tbody = elements.historyTable.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    state.purchases.forEach(purchase => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${purchase.userEmail}</td>
            <td>${purchase.items.map(item => `${item.name} (${item.size}) x${item.quantity}`).join(', ')}</td>
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

        tr.innerHTML = `
            <td>${product.name}</td>
            <td><img src="${product.image}" alt="${product.name}" class="stock-img" style="width:50px;height:50px;object-fit:cover"></td>
            ${[34, 35, 36, 37, 38, 39].map(size => `
                <td>
                    <input 
                        type="number" 
                        value="${product.stockBySize[size] || 0}" 
                        min="0"
                        data-size="${size}" 
                        data-product-id="${product.id}" 
                        class="stock-input"
                        style="width:60px; text-align:center; padding:5px;"
                    />
                </td>
            `).join('')}
           <td>
  <button class="btn-sm btn-primary" data-action="saveStock" data-product-id="${product.id}">
    Salvar
  </button>
  <button class="btn-sm btn-secondary" data-action="restock" data-product-id="${product.id}">
    Reabastecer
  </button>
</td>
        `;

        tbody.appendChild(tr);
    });

    // Botão salvar estoque
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
    const product = state.catalog.find(p => p.id === productId);
    if (!product) return;
    
    const newStock = prompt(`Quantidade para reabastecer ${product.name} em todos os tamanhos:`);
    const quantity = parseInt(newStock);
    
    if (isNaN(quantity) || quantity <= 0) {
        showError('Por favor, insira uma quantidade válida.');
        return;
    }
    
    try {
        // Adiciona a quantidade especificada a todos os tamanhos
        Object.keys(product.stockBySize).forEach(size => {
            product.stockBySize[size] += quantity;
        });
        
        await patchProductStock(productId, product.stockBySize);
        renderStockTable();
        showSuccess(`${product.name} reabastecido com sucesso.`);
    } catch (error) {
        showError('Falha ao reabastecer o produto.');
        console.error(error);
    }
}
async function saveProductStock(productId) {
  const product = state.catalog.find(p => p.id == productId);
  if (!product) return;

  // pega todos inputs do produto
  const inputs = document.querySelectorAll(`input[data-product-id="${productId}"]`);
  inputs.forEach(input => {
    const size = input.dataset.size;
    product.stockBySize[size] = parseInt(input.value) || 0;
  });

  try {
    // PATCH para o servidor
    await patchProductStock(productId, product.stockBySize);
    showSuccess(`Estoque do produto ${product.name} salvo com sucesso.`);
  } catch (err) {
    console.error(err);
    showError('Erro ao salvar estoque.');
  }
}



// =======================
// 7️⃣ Utilitários
// =======================
function showError(message) {
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


  async function patchUser(userId, data) {
  const res = await fetch(`${API}/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Erro ao atualizar usuário');
  return await res.json();
}

async function patchProductStock(productId, stockBySize) {
  const res = await fetch(`${API}/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stockBySize })
  });
  if (!res.ok) throw new Error('Erro ao atualizar estoque');
  return await res.json();
}

// =======================
// 8️⃣ Event listeners
// =======================
function setupEventListeners() {
    // Navegação
    if (elements.goToRegister) elements.goToRegister.addEventListener('click', () => showSection(elements.registerSection));
    if (elements.goToLogin) elements.goToLogin.addEventListener('click', () => showSection(elements.loginSection));
    if (elements.loginBtn) elements.loginBtn.addEventListener('click', () => {
        showSection(elements.loginSection);
        resetForms();
    });
    
    // Logout
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', handleLogout);
    if (elements.adminLogoutBtn) elements.adminLogoutBtn.addEventListener('click', handleLogout);
    
    // Navegação admin/loja
    if (elements.goToAdminBtn) elements.goToAdminBtn.addEventListener('click', showAdminPanel);
    if (elements.goToShopBtn) elements.goToShopBtn.addEventListener('click', showCatalogOnly);
    
    // Carrinho
    if (elements.viewCartBtn) elements.viewCartBtn.addEventListener('click', () => {
        if (!state.currentUser) {
            showError('Faça login para acessar o carrinho.');
            return;
        }
        renderCart();
        if (elements.cartModal) elements.cartModal.style.display = 'flex';
    });
    
    if (elements.closeCartBtn) elements.closeCartBtn.addEventListener('click', () => {
        if (elements.cartModal) elements.cartModal.style.display = 'none';
    });
    
    if (elements.checkoutBtn) elements.checkoutBtn.addEventListener('click', () => {
        if (state.cart.length === 0) {
            showError('Seu carrinho está vazio.');
            return;
        }
        
        if (elements.customerName) elements.customerName.textContent = state.currentUser.name;
        if (elements.paymentTotal) elements.paymentTotal.textContent = formatCurrency(calculateCartTotal());
        if (elements.cartModal) elements.cartModal.style.display = 'none';
        showSection(elements.paymentSection);
        resetForms();
    });
    
    // Pagamento
    if (elements.confirmPaymentBtn) elements.confirmPaymentBtn.addEventListener('click', processPayment);
    if (elements.backToShopBtn) elements.backToShopBtn.addEventListener('click', showCatalogOnly);
    
    if (elements.paymentMethod) elements.paymentMethod.addEventListener('change', () => {
        if (elements.pixDetails) elements.pixDetails.style.display = elements.paymentMethod.value === 'pix' ? 'block' : 'none';
        if (elements.cardDetails) elements.cardDetails.style.display = elements.paymentMethod.value === 'card' ? 'block' : 'none';
    });
    
    // Formulários
    if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
    if (elements.registerForm) elements.registerForm.addEventListener('submit', handleRegistration);
    
    // Modal de tamanhos
    if (elements.confirmSizeBtn) elements.confirmSizeBtn.addEventListener('click', () => {
        const selectedSize = elements.sizeSelect.value;
        if (!selectedSize) {
            showError('Selecione um tamanho.');
            return;
        }
        
        if (!state.selectedProduct) {
            showError('Nenhum produto selecionado. Tente novamente.');
            return;
        }
        
        addToCartWithSize(state.selectedProduct, selectedSize);
    });
    
    if (elements.cancelSizeBtn) elements.cancelSizeBtn.addEventListener('click', () => {
        state.selectedProduct = null;
        if (elements.sizeModal) elements.sizeModal.style.display = 'none';
    });
    
    // Botão explorar na hero section
    const exploreBtn = document.getElementById('exploreBtn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            document.getElementById('dashboard-section').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Navegação do menu principal
    const navSobre = document.getElementById('navSobre');
    const navInicio = document.getElementById('navInicio');
    const navProdutos = document.getElementById('navProdutos');
    
    if (navSobre) navSobre.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Sobre nós: Somos uma loja especializada em tênis de qualidade!');
    });
    
    if (navInicio) navInicio.addEventListener('click', (e) => {
        e.preventDefault();
        showCatalogOnly();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    if (navProdutos) navProdutos.addEventListener('click', (e) => {
        e.preventDefault();
        showCatalogOnly();
        document.getElementById('dashboard-section').scrollIntoView({ behavior: 'smooth' });
    });
}

function handleLogout() {
    state.currentUser = null;
    state.cart = [];
    localStorage.removeItem('currentUser');
    resetForms();
    
    // Atualizar UI e mostrar mensagem
    updateUIForUser();
    renderCatalog();
    showCatalogOnly();
    showSuccess('Você saiu da sua conta.');
}

// =======================
// 9️⃣ Inicialização
// =======================
document.addEventListener('DOMContentLoaded', fetchData);