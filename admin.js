// URL do JSON no GitHub
const API = "https://shoe-jtqx.onrender.com";

// Estado do painel admin
const state = {
  users: [],
  catalog: [],
  purchases: []
};

// Elementos só do admin.html
const userTable    = document.getElementById('userTable');
const historyTable = document.getElementById('historyTable');
const stockTable   = document.getElementById('stockTable');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const goToShopBtn  = document.getElementById('goToShopBtn');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  await fetchData();
  renderAdminTables();
});

// Carregar dados do servidor
async function fetchData() {
  try {
    const [u, p, h] = await Promise.all([
      fetch(`${API}/users`).then(r => r.json()),
      fetch(`${API}/products`).then(r => r.json()),
      fetch(`${API}/purchases`).then(r => r.json())
    ]);
    state.users = u;
    state.catalog = p;
    state.purchases = h;
  } catch (err) {
    alert('Erro ao carregar dados do servidor');
    console.error(err);
  }
}

// =============== Renderização das tabelas ===============
function renderAdminTables() {
  renderUserTable();
  renderHistoryTable();
  renderStockTable();
}

function renderUserTable() {
  if (!userTable) return;
  const tbody = userTable.querySelector('tbody');
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

  tbody.querySelectorAll('[data-action="toggleUser"]').forEach(btn => {
    btn.addEventListener('click', async e => {
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
    alert(`Status de ${user.name} atualizado.`);
  } catch (err) {
    alert('Falha ao atualizar o status do usuário.');
    console.error(err);
  }
}

function renderHistoryTable() {
  if (!historyTable) return;
  const tbody = historyTable.querySelector('tbody');
  tbody.innerHTML = '';

  state.purchases.forEach(purchase => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${purchase.userEmail}</td>
      <td>${purchase.items.map(i => `${i.name} (${i.size}) x${i.quantity}`).join(', ')}</td>
      <td>${formatCurrency(purchase.total)}</td>
      <td>${purchase.date}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStockTable() {
  if (!stockTable) return;
  const tbody = stockTable.querySelector('tbody');
  tbody.innerHTML = '';

  state.catalog.forEach(product => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${product.name}</td>
      <td><img src="${product.image}" style="width:50px;height:50px;object-fit:cover"></td>
      ${[34, 35, 36, 37, 38, 39].map(size => `
        <td>
          <input type="number" 
                 value="${product.stockBySize[size] || 0}" 
                 min="0"
                 data-size="${size}" 
                 data-product-id="${product.id}" 
                 class="stock-input"
                 style="width:60px; text-align:center; padding:5px;">
        </td>
      `).join('')}
      <td>
        <button class="btn-sm btn-primary" data-action="saveStock" data-product-id="${product.id}">Salvar</button>
        <button class="btn-sm btn-secondary" data-action="restock" data-product-id="${product.id}">Reabastecer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-action="saveStock"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.target.dataset.productId;
      await saveProductStock(id);
    });
  });

  tbody.querySelectorAll('[data-action="restock"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.target.dataset.productId;
      await restockProduct(id);
    });
  });
}

async function saveProductStock(productId) {
  const product = state.catalog.find(p => p.id == productId);
  if (!product) return;
  const inputs = document.querySelectorAll(`input[data-product-id="${productId}"]`);
  inputs.forEach(input => {
    const size = input.dataset.size;
    product.stockBySize[size] = parseInt(input.value) || 0;
  });
  try {
    await patchProductStock(productId, product.stockBySize);
    alert(`Estoque de ${product.name} salvo com sucesso.`);
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar estoque.');
  }
}

async function restockProduct(productId) {
  const product = state.catalog.find(p => p.id === productId);
  if (!product) return;
  const newStock = prompt(`Quantidade para reabastecer ${product.name} em todos os tamanhos:`);
  const quantity = parseInt(newStock);
  if (isNaN(quantity) || quantity <= 0) {
    alert('Insira uma quantidade válida.');
    return;
  }
  try {
    Object.keys(product.stockBySize).forEach(size => {
      product.stockBySize[size] += quantity;
    });
    await patchProductStock(productId, product.stockBySize);
    renderStockTable();
    alert(`${product.name} reabastecido com sucesso.`);
  } catch (err) {
    console.error(err);
    alert('Falha ao reabastecer o produto.');
  }
}

// =============== Utilitários / PATCH ===============
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

// =============== Botões navegação admin ===============
if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html'; // volta para a loja
});

if (goToShopBtn) goToShopBtn.addEventListener('click', () => {
  window.location.href = 'index.html'; // volta para a loja
});
