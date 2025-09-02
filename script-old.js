// URL base do json-server
//const API = "http://localhost:3000";
const API = "https://raw.githubusercontent.com/felipecandi59-prog/Shoe/main/db.json";



async function fetchData() {
  try {
    const response = await fetch(API);
    if (!response.ok) throw new Error("Erro ao carregar JSON do GitHub");
    const data = await response.json();
    state.users = data.users;
    state.products = data.products;
    state.purchases = data.purchases;
    renderCatalog();
    checkLoggedUser();
  } catch (error) {
    console.error("Erro:", error);
    alert("Não foi possível carregar os dados da loja!");
  }
}

// estado da aplicação
const state = {
    users: [],
    catalog: [],
    currentUser: null,
    cart: [],
    selectedProduct: null,
    selectedSize: null,
    purchases: []
};

// cache de elementos DOM
const elements = {
    // Seções
    loginSection: document.getElementById('login-section'),
    registerSection: document.getElementById('register-section'),
    dashboardSection: document.getElementById('dashboard-section'),
    adminSection: document.getElementById('admin-section'),
    paymentSection: document.getElementById('payment-section'),
    
    // Elementos de catálogo e carrinho
    catalogDiv: document.getElementById('catalog'),
    cartCount: document.getElementById('cartCount'),
    cartModal: document.getElementById('cartModal'),
    cartItems: document.getElementById('cartItems'),
    cartTotal: document.getElementById('cartTotal'),
    customerName: document.getElementById('customerName'),
    paymentTotal: document.getElementById('paymentTotal'),
    
    // Formulários
    registerForm: document.getElementById('registerForm'),
    loginForm: document.getElementById('loginForm'),
    paymentForm: document.getElementById('paymentForm'),
    
    // Botões e controles
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
    
    // Modal de tamanhos
    sizeModal: document.getElementById('sizeModal'),
    sizeSelect: document.getElementById('sizeSelect'),
    confirmSizeBtn: document.getElementById('confirmSizeBtn'),
    cancelSizeBtn: document.getElementById('cancelSizeBtn'),
    
    // Detalhes de pagamento
    pixDetails: document.getElementById('pixDetails'),
    cardDetails: document.getElementById('cardDetails'),
    
    // Tabelas administrativas
    userTable: document.getElementById('userTable'),
    historyTable: document.getElementById('historyTable'),
    stockTable: document.getElementById('stockTable')
};

// --- Funções de API ---
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro na requisição:', error);
        showError('Falha na comunicação com o servidor. Verifique se o json-server está rodando.');
        throw error;
    }
}

async function fetchAll() {
    try {
        const [products, users, purchases] = await Promise.all([
            apiRequest('/products'),
            apiRequest('/users'),
            apiRequest('/purchases')
        ]);
        
        state.catalog = products;
        state.users = users;
        state.purchases = purchases;
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

async function patchProductStock(id, stockBySize) {
    return apiRequest(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stockBySize })
    });
}

async function patchUser(id, payload) {
    return apiRequest(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

async function postPurchase(purchase) {
    return apiRequest('/purchases', {
        method: 'POST',
        body: JSON.stringify(purchase)
    });
}

async function postUser(user) {
    return apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(user)
    });
}

// --- Utilitários ---
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

// --- Gerenciamento de UI ---
function showSection(section) {
    // Oculta todas as seções
    const sections = [
        elements.loginSection,
        elements.registerSection,
        elements.dashboardSection,
        elements.adminSection,
        elements.paymentSection
    ];
    
    sections.forEach(sec => {
        if (sec) sec.style.display = 'none';
    });
    
    // Mostra a seção solicitada
    if (section) section.style.display = 'block';
    
    // Atualiza a UI baseada no usuário atual
    updateUIForUser();
}

function updateUIForUser() {
    const { currentUser } = state;
    if (elements.loginBtn) elements.loginBtn.style.display = currentUser ? 'none' : 'inline-block';
    if (elements.logoutBtn) elements.logoutBtn.style.display = currentUser ? 'inline-block' : 'none';
    if (elements.goToAdminBtn) elements.goToAdminBtn.style.display = (currentUser && currentUser.isAdmin) ? 'inline-block' : 'none';
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

// --- Renderização do catálogo ---
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

// --- Modal de seleção de tamanho ---
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

async function addToCartWithSize(product, size) {
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
    
    // Atualiza o estoque
    const productIndex = state.catalog.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
        state.catalog[productIndex].stockBySize[size]--;
        
        try {
            await patchProductStock(product.id, state.catalog[productIndex].stockBySize);
            updateCartUI();
            if (elements.sizeModal) elements.sizeModal.style.display = 'none';
            showSuccess(`${product.name} - tamanho ${size} adicionado ao carrinho!`);
        } catch (error) {
            showError('Falha ao atualizar o estoque. Tente novamente.');
            console.error(error);
        }
    }
}

// --- Gerenciamento do carrinho ---
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
        
        // Restaura o estoque
        const product = state.catalog.find(p => p.id === item.product.id);
        if (product) {
            product.stockBySize[item.size] += item.quantity;
            patchProductStock(product.id, product.stockBySize);
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

// --- Função para salvar estoque ---
async function saveProductStock(productId) {
    const inputs = document.querySelectorAll(`.stock-input[data-product-id="${productId}"]`);
    const stockBySize = {};

    inputs.forEach(input => {
        const size = input.dataset.size;
        stockBySize[size] = parseInt(input.value) || 0;
    });

    try {
        await patchProductStock(productId, stockBySize);
        await fetchAll(); // Recarrega os dados do servidor
        renderStockTable(); // Atualiza a tabela
        showSuccess('Estoque atualizado com sucesso!');
    } catch (error) {
        showError('Erro ao salvar o estoque.');
        console.error(error);
    }
}

// --- Painel administrativo ---
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

// --- Processamento de pagamento ---
async function processPayment() {
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
    
    try {
        await postPurchase(purchase);
        state.purchases.push(purchase);
        showSuccess('Compra realizada com sucesso!');
        clearCart();
        showCatalogOnly();
    } catch (error) {
        showError('Falha ao processar o pagamento. Tente novamente.');
        console.error(error);
    }
}

// --- Autenticação de usuário ---
async function handleLogin(e) {
    e.preventDefault();
    
    const email = elements.loginForm.loginEmail.value.trim();
    const password = elements.loginForm.loginPassword.value.trim();
    
    if (!email || !password) {
        showError('Por favor, preencha todos os campos.');
        return;
    }
    
    try {
        await fetchAll();
        
        const user = state.users.find(u => u.email === email);
        
        if (!user) {
            showError('Email não encontrado. Verifique ou crie uma nova conta.');
            return;
        }
        
        if (user.password !== password) {
            showError('Senha incorreta. Tente novamente.');
            return;
        }
        
        if (!user.active) {
            showError('Sua conta está desativada. Entre em contato conosco.');
            return;
        }
        
        state.currentUser = user;
        
        localStorage.setItem('currentUser', JSON.stringify({
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin
        }));
        
        showSuccess(`Bem-vindo(a) de volta, ${user.name}!`);
        resetForms();
        
        // Atualizar a UI e permanecer na loja
        updateUIForUser();
        renderCatalog(); // Re-renderizar os produtos com botões ativos
        
    } catch (error) {
        showError('Erro durante o login. Tente novamente.');
        console.error('Erro no login:', error);
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    
    const name = elements.registerForm.regName.value.trim();
    const email = elements.registerForm.regEmail.value.trim();
    const password = elements.registerForm.regPassword.value;
    const confirmPassword = elements.registerForm.regPasswordConfirm.value;
    
    // Validações
    if (!name || !email || !password || !confirmPassword) {
        showError('Por favor, preencha todos os campos.');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('As senhas não coincidem.');
        return;
    }
    
    if (password.length < 6) {
        showError('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    if (state.users.find(u => u.email === email)) {
        showError('Este email já está cadastrado.');
        return;
    }
    
    const newUser = {
        name,
        email,
        password,
        active: true,
        isAdmin: false
    };
    
    try {
        const createdUser = await postUser(newUser);
        state.users.push(createdUser);
        showSuccess('Cadastro realizado com sucesso!');
        elements.registerSection.style.display = 'none';
        elements.loginSection.style.display = 'block';
        resetForms();
    } catch (error) {
        showError('Falha ao criar a conta. Tente novamente.');
        console.error(error);
    }
}

// --- Configuração de event listeners ---
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
}

function handleLogout() {
    state.currentUser = null;
    state.cart = [];
    localStorage.removeItem('currentUser');
    resetForms();
    
    // Atualizar UI e mostrar mensagem
    updateUIForUser();
    renderCatalog(); // Re-renderizar os produtos com botões desativados
    showCatalogOnly();
    showSuccess('Você saiu da sua conta.');
}

// --- Inicialização da aplicação ---
async function initializeApp() {
    try {
        await fetchAll();
        setupEventListeners();
        
        // SEMPRE mostrar a loja primeiro, independente de login
        showCatalogOnly();
        
        // Verificar se há um usuário logado previamente apenas para atualizar UI
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            const user = state.users.find(u => u.email === userData.email);
            
            if (user && user.active) {
                state.currentUser = user;
                updateUIForUser();
                renderCatalog(); // Re-renderizar para mostrar botões ativos
                showSuccess(`Bem-vindo(a) de volta, ${user.name}!`);
            }
        }
        
    } catch (error) {
        showError('Falha ao inicializar a aplicação.');
        console.error(error);
    }
}

// Inicia a aplicação quando o DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Funções de debug para o console
function debugCart() {
    console.log('Itens no carrinho:', state.cart);
    console.log('Quantidade total:', state.cart.reduce((total, item) => total + item.quantity, 0));
}

function testAddToCart() {
    if (state.catalog.length === 0) {
        showError('Nenhum produto carregado.');
        return;
    }
    
    // Adiciona o primeiro produto do catálogo (apenas para teste)
    const testProduct = state.catalog[0];
    const availableSize = Object.keys(testProduct.stockBySize).find(size => 
        testProduct.stockBySize[size] > 0
    );
    
    if (availableSize) {
        addToCartWithSize(testProduct, availableSize);
        showSuccess('Item de teste adicionado ao carrinho!');
    } else {
        showError('Nenhum tamanho disponível para teste.');
    }
}


fetchData();