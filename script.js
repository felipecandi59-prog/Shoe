// ==========================
// IMPORTS E INICIALIZAÇÃO
// ==========================
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ==========================
// ELEMENTOS DO DO
// ==========================
const catalogDiv = document.getElementById('catalog');
const logoutBtn = document.getElementById('logoutBtn');
const goToAdminBtn = document.getElementById('goToAdminBtn');
const openSettingsBtn = document.getElementById('open-settings-btn');
const userSettingsSection = document.getElementById('user-settings-section');
const backToCatalogBtn = document.getElementById('back-to-catalog');

const sizeModal = document.getElementById('sizeModal');
const sizeSelect = document.getElementById('sizeSelect');
const confirmSizeBtn = document.getElementById('confirmSizeBtn');
const cancelSizeBtn = document.getElementById('cancelSizeBtn');

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
let selectedProduct = null;

window.openSizeModal = function(productId) {
  selectedProduct = null;
  sizeSelect.innerHTML = '';
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
// LOGIN / LOGOUT E BOTÕES DE USUÁRIO
// ==========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    logoutBtn.style.display = "inline-block";
    openSettingsBtn.style.display = "inline-block";

    // Pegar dados do usuário no Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    // Se for admin
    goToAdminBtn.style.display = userData?.admin ? "inline-block" : "none";

  } else {
    logoutBtn.style.display = "none";
    openSettingsBtn.style.display = "none";
    goToAdminBtn.style.display = "none";
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.reload();
});

openSettingsBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

goToAdminBtn.addEventListener("click", () => {
  window.location.href = "admin.html";
});

// ==========================
// CONFIGURAÇÕES DO USUÁRIO
// ==========================
backToCatalogBtn.addEventListener("click", () => {
  userSettingsSection.style.display = 'none';
  catalogDiv.parentElement.style.display = 'block';
});

// ==========================
// INICIALIZAÇÃO
// ==========================
loadProducts();
