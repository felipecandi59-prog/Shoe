// ==========================
// IMPORTS E INICIALIZAÇÃO
// ==========================
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

// ==========================
// ELEMENTOS DO DOM
// ==========================
const catalogDiv = document.getElementById('catalog');
const logoutBtn = document.getElementById('logoutBtn');
const goToAdminBtn = document.getElementById('goToAdminBtn');
const openSettingsBtn = document.getElementById('open-settings-btn');
const userSettingsSection = document.getElementById('user-settings-section');
const backToCatalogBtn = document.getElementById('back-to-catalog');

// ==========================
// CARRINHO DE COMPRAS
// ==========================
let cart = [];

function addToCart(product, size) {
  cart.push({ ...product, size });
  alert(`Produto ${product.name} (tamanho ${size}) adicionado ao carrinho!`);
}

// ==========================
// FUNÇÃO PARA CARREGAR PRODUTOS
// ==========================
async function loadProducts() {
  catalogDiv.innerHTML = '';
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    querySnapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>R$ ${product.price.toFixed(2)}</p>
        <button class="btn-primary" onclick="openSizeModal('${product.id}')">Comprar</button>
      `;
      catalogDiv.appendChild(productCard);
    });
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    catalogDiv.innerHTML = '<p>Não foi possível carregar os produtos.</p>';
  }
}

// ==========================
// MODAL DE TAMANHO
// ==========================
const sizeModal = document.getElementById('sizeModal');
const sizeSelect = document.getElementById('sizeSelect');
const confirmSizeBtn = document.getElementById('confirmSizeBtn');
const cancelSizeBtn = document.getElementById('cancelSizeBtn');

let selectedProduct = null;

window.openSizeModal = function(productId) {
  selectedProduct = null;
  sizeSelect.innerHTML = '';
  // Busca produto pelo ID
  getDocs(collection(db, "products")).then(snapshot => {
    snapshot.forEach(doc => {
      if (doc.id === productId) selectedProduct = { id: doc.id, ...doc.data() };
    });
    if (selectedProduct) {
      selectedProduct.sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        sizeSelect.appendChild(option);
      });
      sizeModal.style.display = 'block';
    }
  });
};

confirmSizeBtn.onclick = () => {
  const selectedSize = sizeSelect.value;
  if (selectedProduct && selectedSize) addToCart(selectedProduct, selectedSize);
  sizeModal.style.display = 'none';
};

cancelSizeBtn.onclick = () => {
  sizeModal.style.display = 'none';
};

// ==========================
// LOGIN / LOGOUT
// ==========================
onAuthStateChanged(auth, user => {
  if (user) {
    logoutBtn.style.display = 'inline-block';
    openSettingsBtn.style.display = 'inline-block';
    // Verifica se é admin (exemplo: email admin)
    goToAdminBtn.style.display = user.email === 'admin@loja.com' ? 'inline-block' : 'none';
  } else {
    logoutBtn.style.display = 'none';
    openSettingsBtn.style.display = 'none';
    goToAdminBtn.style.display = 'none';
  }
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    alert('Você saiu da conta.');
    window.location.reload();
  });
});

// ==========================
// CONFIGURAÇÕES DO USUÁRIO
// ==========================
openSettingsBtn.addEventListener('click', () => {
  userSettingsSection.style.display = 'block';
  catalogDiv.parentElement.style.display = 'none';
});

backToCatalogBtn.addEventListener('click', () => {
  userSettingsSection.style.display = 'none';
  catalogDiv.parentElement.style.display = 'block';
});

// ==========================
// INICIALIZAÇÃO
// ==========================
loadProducts();



//teste

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";


// Função para atualizar visibilidade de botões conforme login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    logoutBtn.style.display = "inline-block";
    openSettingsBtn.style.display = "inline-block";

    // Pegar dados do usuário
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    // Se for admin
    if (userData?.admin) {
      goToAdminBtn.style.display = "inline-block";
    }

  } else {
    logoutBtn.style.display = "none";
    goToAdminBtn.style.display = "none";
    openSettingsBtn.style.display = "none";
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

// Abrir dashboard
openSettingsBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html"; // ou área de usuário
});

// Abrir painel admin (se admin)
goToAdminBtn.addEventListener("click", () => {
  window.location.href = "admin.html"; // se existir
});
