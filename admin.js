// admin.js
import { auth, db } from "./firebase-config.js";
import { collection, addDoc, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

  // ELEMENTOS DO DOM
  const addProductForm = document.getElementById("add-product-form");
  const productListDiv = document.getElementById("product-list");

  const btnLogout = document.createElement("button");
  btnLogout.textContent = "Sair";
  btnLogout.classList.add("btn-secondary");
  document.querySelector(".header-actions")?.appendChild(btnLogout);

  // FUNÇÃO PARA LISTAR PRODUTOS
  async function loadProducts() {
    productListDiv.innerHTML = '';
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      querySnapshot.forEach(docItem => {
        const product = { id: docItem.id, ...docItem.data() };
        const productCard = document.createElement("div");
        productCard.className = "card";
        productCard.innerHTML = `
          <h3>${product.name}</h3>
          <p>R$ ${Number(product.price).toFixed(2)}</p>
          <p>Tamanhos: ${product.sizes.join(", ")}</p>
          <img src="${product.image}" alt="${product.name}" style="width:${product.width || 100}px; height:${product.height || 100}px; border-radius:10px;">

        `;
        productListDiv.appendChild(productCard);
      });
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      productListDiv.innerHTML = "<p>Não foi possível carregar os produtos.</p>";
    }
  }

  // FUNÇÃO PARA ADICIONAR PRODUTOS
  addProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const image = document.getElementById("productImage").value.trim();
    const sizes = document.getElementById("productSizes").value.split(",").map(s => s.trim());
 
    const width = parseInt(document.getElementById("productWidth").value) || 100; // valor padrão
    const height = parseInt(document.getElementById("productHeight").value) || 100;


    if (!name || !price || !image || sizes.length === 0) {
      alert("Preencha todos os campos corretamente!");
      return;
    }

    try {
      await addDoc(collection(db, "products"), {
        name,
        price,
        image,
        sizes,
        width,
        height
      });
      alert("Produto adicionado com sucesso!");
      addProductForm.reset();
      loadProducts();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      alert("Erro ao adicionar produto. Veja o console.");
    }
  });

  // LOGOUT
  btnLogout.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // GARANTE LOGIN ADMIN
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Checa se o usuário é admin no Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      if (!userData?.admin) {
        alert("Você não tem acesso a esta página.");
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Erro ao verificar admin:", error);
      window.location.href = "index.html";
    }

    // Se admin, carrega produtos
    loadProducts();
  });

});
