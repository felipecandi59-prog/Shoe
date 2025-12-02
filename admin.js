// admin.js
import { auth, db } from "./firebase-config.js";
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

  // ELEMENTOS DO DOM
  const addProductForm = document.getElementById("add-product-form");
  const productListDiv = document.getElementById("product-list");
  const userListDiv = document.getElementById("user-list"); // novo container para usuários

  // BOTÃO DE LOGOUT
  const btnLogout = document.createElement("button");
  btnLogout.textContent = "Sair";
  btnLogout.classList.add("btn-secondary");
  document.querySelector(".header-actions")?.appendChild(btnLogout);

  // ==========================
  // FUNÇÃO LISTAR PRODUTOS
  // ==========================
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
          <button class="btn-secondary delete-btn">Excluir</button>
        `;
        productListDiv.appendChild(productCard);

        // BOTÃO EXCLUIR PRODUTO
        const deleteBtn = productCard.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", async () => {
          if (confirm(`Deseja realmente apagar o produto "${product.name}"?`)) {
            try {
              await deleteDoc(doc(db, "products", product.id));
              alert("Produto removido com sucesso!");
              loadProducts();
            } catch (error) {
              console.error("Erro ao apagar produto:", error);
              alert("Erro ao apagar produto. Veja o console.");
            }
          }
        });
      });
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      productListDiv.innerHTML = "<p>Não foi possível carregar os produtos.</p>";
    }
  }

  // ==========================
  // FUNÇÃO LISTAR USUÁRIOS
  // ==========================
  async function loadUsers() {
    if (!userListDiv) return;
    userListDiv.innerHTML = '';
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      querySnapshot.forEach(docItem => {
        const user = { id: docItem.id, ...docItem.data() };
        const userCard = document.createElement("div");
        userCard.className = "card";
        userCard.innerHTML = `
          <p><strong>${user.nome || user.email}</strong></p>
          <p>Email: ${user.email}</p>
          <p>Status: <span class="status-text">${user.active ? "Ativo" : "Desativado"}</span></p>
          <button class="btn-primary toggleStatusBtn">${user.active ? "Desativar" : "Ativar"}</button>
        `;
        userListDiv.appendChild(userCard);

        // BOTÃO ATIVAR/DESATIVAR
        const toggleBtn = userCard.querySelector(".toggleStatusBtn");
        toggleBtn.addEventListener("click", async () => {
          try {
            await updateDoc(doc(db, "users", user.id), {
              active: !user.active
            });
            alert(`Usuário ${user.nome || user.email} atualizado!`);
            loadUsers();
          } catch (err) {
            console.error("Erro ao atualizar status:", err);
            alert("Erro ao atualizar status do usuário.");
          }
        });
      });
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      if (userListDiv) userListDiv.innerHTML = "<p>Não foi possível carregar usuários.</p>";
    }
  }

  // ==========================
  // ADICIONAR PRODUTO
  // ==========================
  addProductForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const image = document.getElementById("productImage").value.trim();
    const sizes = document.getElementById("productSizes").value.split(",").map(s => s.trim());
    const width = parseInt(document.getElementById("productWidth").value) || 100;
    const height = parseInt(document.getElementById("productHeight").value) || 100;

    if (!name || !price || !image || sizes.length === 0) {
      alert("Preencha todos os campos corretamente!");
      return;
    }

    try {
      await addDoc(collection(db, "products"), { name, price, image, sizes, width, height });
      alert("Produto adicionado com sucesso!");
      addProductForm.reset();
      loadProducts();
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
      alert("Erro ao adicionar produto. Veja o console.");
    }
  });

  // ==========================
  // LOGOUT
  // ==========================
  btnLogout.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  // ==========================
  // GARANTIR LOGIN ADMIN
  // ==========================
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      if (!userData?.admin) {
        alert("Você não tem acesso a esta página.");
        window.location.href = "index.html";
        return;
      }
    } catch (err) {
      console.error("Erro ao verificar admin:", err);
      window.location.href = "index.html";
      return;
    }

    // Carregar produtos e usuários
    loadProducts();
    loadUsers();
  });

});
