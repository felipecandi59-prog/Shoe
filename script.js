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

const confirmSizeBtn = document.getElementById('confirmSizeBtn');
const cancelSizeBtn = document.getElementById('cancelSizeBtn');
const backToCatalogBtn = document.getElementById('back-to-catalog');

let selectedProduct = null;
let selectedProductImg = null;
let cart = [];

// ==========================
// FUNÇÃO FLY-TO-CART
// ==========================
function flyToCart(imgElement, targetSelector) {
    const cartBtn = document.querySelector(targetSelector);
    if (!imgElement || !cartBtn) return;

    const imgClone = imgElement.cloneNode(true);
    const rect = imgElement.getBoundingClientRect();
    const cartRect = cartBtn.getBoundingClientRect();

    imgClone.style.position = "fixed";
    imgClone.style.left = rect.left + "px";
    imgClone.style.top = rect.top + "px";
    imgClone.style.width = rect.width + "px";
    imgClone.style.height = rect.height + "px";
    imgClone.style.transition = "all 0.8s ease";
    imgClone.style.zIndex = "1000";
    imgClone.style.borderRadius = "12px";

    document.body.appendChild(imgClone);

    setTimeout(() => {
        imgClone.style.left = cartRect.left + "px";
        imgClone.style.top = cartRect.top + "px";
        imgClone.style.width = "20px";
        imgClone.style.height = "20px";
        imgClone.style.opacity = "0.3";
    }, 50);

    setTimeout(() => {
        imgClone.remove();
    }, 900);
}

// ==========================
// ADCIONAR AO CARRINHO
// ==========================
function addToCart(product, size, productImg) {
    cart.push({ ...product, size });
    alert(`Produto ${product.name} (Tamanho: ${size}) adicionado ao carrinho.`);

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
            const imgId = `img-${product.id}`;

            const productCard = document.createElement('div');
            productCard.className = 'product-card';

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
        catalogDiv.innerHTML = `<p>Erro ao carregar catálogo.</p>`;
    }
}

// ==========================
// MODAL DE TAMANHO — CORRIGIDO
// ==========================
window.openSizeModal = async function (productId, imgId) {
    selectedProductImg = document.getElementById(imgId);
    sizeSelect.innerHTML = '';

    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            alert("Produto não encontrado.");
            return;
        }

        selectedProduct = { id: docSnap.id, ...docSnap.data() };

        selectedProduct.sizes.forEach(size => {
            const option = document.createElement("option");
            option.value = size;
            option.textContent = size;
            sizeSelect.appendChild(option);
        });

        sizeModal.style.display = "block";
    } catch (err) {
        console.error("Erro ao carregar produto:", err);
    }
};

// ==========================
// BOTÕES DO MODAL
// ==========================
confirmSizeBtn.onclick = () => {
    const selectedSize = sizeSelect.value;
    if (selectedProduct && selectedSize) {
        addToCart(selectedProduct, selectedSize, selectedProductImg);
    }
    sizeModal.style.display = "none";
};

cancelSizeBtn.onclick = () => {
    sizeModal.style.display = "none";
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

backToCatalogBtn?.addEventListener("click", () => {
    userSettingsSection.style.display = 'none';
    catalogDiv.parentElement.style.display = 'block';
});

// ==========================
// INICIALIZAR CATÁLOGO
// ==========================
loadProducts();
