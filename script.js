// ==========================
// IMPORTS E INICIALIZAÇÃO
// ==========================
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ==========================
// ELEMENTOS DO DOM
// ==========================
const catalogDiv = document.getElementById('catalog');
const logoutBtn = document.getElementById('logoutBtn');
const goToAdminBtn = document.getElementById('goToAdminBtn');
const openSettingsBtn = document.getElementById('open-settings-btn');
const userSettingsSection = document.getElementById('user-settings-section');

const sizeModal = document.getElementById('sizeModal');
const sizeSelect = document.getElementById('sizeSelect');

let selectedProduct = null;
let selectedProductImg = null; // REFERÊNCIA DA IMAGEM
let cart = [];

// ==========================
// FUNÇÃO DE ANIMAÇÃO FLY TO CART
// ==========================

// ==========================
// FUNÇÃO ADD TO CART
// ==========================
function addToCart(product, size, productImg) {
  cart.push({ ...product, size });
  alert(`Produto ${product.name} (tamanho ${size}) adicionado ao carrinho!`);

  if (productImg) flyToCart(productImg, '.cart-btn');
}

// ==========================
// CARREGAR PRODUTOS
// ==========================
async function loadProducts() {
  catalogDiv.innerHTML = '';
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    querySnapshot.forEach((docSnap) => {
      const product = { id: docSnap.id, ...docSnap.data() };
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      
      // Gera ID único para a imagem
      const imgId = `img-${product.id}`;
      productCard.innerHTML = `
        <img id="${imgId}" src="${product.image}" 
             alt="${product.name}" 
             style="width:${product.width || 200}px; height:${product.height || 150}px; object-fit:cover; border-radius:12px;">
        <h3>${product.name}</h3>
        <p>R$ ${product.price.toFixed(2)}</p>
        <button class="btn-primary" onclick="openSizeModal('${product.id}', '${imgId}')">Comprar</button>
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
window.openSizeModal = function(productId, imgId) {
  selectedProduct = null;
  selectedProductImg = document.getElementById(imgId); // SALVA REFERÊNCIA DA IMAGEM
  sizeSelect.innerHTML = '';

  getDocs(collection(db, "products")).then(snapshot => {
    snapshot.forEach(docSnap => {
      if (docSnap.id === productId) selectedProduct = { id: docSnap.id, ...docSnap.data() };
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

// ==========================
// MODAL BUTTONS
// ==========================
const confirmSizeBtn = document.getElementById('confirmSizeBtn');
const cancelSizeBtn = document.getElementById('cancelSizeBtn');
const backToCatalogBtn = document.getElementById('back-to-catalog');

confirmSizeBtn.onclick = () => {
  const selectedSize = sizeSelect.value;
  if (selectedProduct && selectedSize) addToCart(selectedProduct, selectedSize, selectedProductImg);
  sizeModal.style.display = 'none';
};

cancelSizeBtn.onclick = () => {
  sizeModal.style.display = 'none';
};

// ==========================
// LOGIN / LOGOUT
// ==========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    logoutBtn.style.display = "inline-block";
    openSettingsBtn.style.display = "inline-block";

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;
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
