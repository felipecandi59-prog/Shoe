import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// DOM Elements
const btnLogout = document.getElementById("btnLogout");
const btnBack = document.getElementById("btnBack");
const addProductForm = document.getElementById("add-product-form");
const productListDiv = document.getElementById("product-list");

let currentUser = null;

// ==========================
// VERIFICA ADMIN
// ==========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    // Apenas admin
    const docUser = await getDoc(doc(db, "users", user.uid));
    const userData = docUser.data();
    if(!userData?.admin){
      alert("Acesso negado: você não é admin!");
      window.location.href = "index.html";
    }

    // Carregar produtos
    loadProducts();
  } else {
    window.location.href = "login.html";
  }
});

// ==========================
// LOGOUT / VOLTAR
// ==========================
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

btnBack.addEventListener("click", () => {
  window.location.href = "index.html";
});

// ==========================
// ADICIONAR PRODUTO
// ==========================
addProductForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const image = document.getElementById("productImage").value.trim();
  const sizes = document.getElementById("productSizes").value.split(",").map(s => s.trim());

  try {
    await addDoc(collection(db, "products"), {
      name,
      price,
      image,
      sizes
    });
    alert("Produto adicionado com sucesso!");
    addProductForm.reset();
    loadProducts();
  } catch (err) {
    console.error("Erro ao adicionar produto:", err);
    alert("Erro ao adicionar produto: " + err.message);
  }
});

// ==========================
// CARREGAR PRODUTOS
// ==========================
async function loadProducts() {
  productListDiv.innerHTML = "";
  const snapshot = await getDocs(collection(db, "products"));
  snapshot.forEach(docSnap => {
    const product = docSnap.data();
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <h4>${product.name}</h4>
      <p>R$ ${product.price.toFixed(2)}</p>
      <img src="${product.image}" alt="${product.name}" style="max-width:100px;">
      <p>Tamanhos: ${product.sizes.join(", ")}</p>
      <button data-id="${docSnap.id}" class="delete-btn">Excluir</button>
    `;
    productListDiv.appendChild(div);

    // Deletar produto
    div.querySelector(".delete-btn").addEventListener("click", async () => {
      await deleteDoc(doc(db, "products", docSnap.id));
      loadProducts();
    });
  });
}
