import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Elementos DOM
const userNameSpan = document.getElementById("userName");
const btnLogout = document.getElementById("btnLogout");
const btnBack = document.getElementById("btnBack"); // Botão voltar para loja
const userSettingsForm = document.getElementById("user-settings-form");
const newNameInput = document.getElementById("newName");
const newPasswordInput = document.getElementById("newPassword");
const ordersList = document.getElementById("orders-list");

// Usuário atual
let currentUser = null;

// ==========================
// VERIFICA LOGIN
// ==========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    // Pega dados do Firestore
    const docUser = await getDoc(doc(db, "users", user.uid));
    const userData = docUser.exists() ? docUser.data() : null;

    userNameSpan.textContent = userData?.nome || user.email;
    if(newNameInput) newNameInput.value = userData?.nome || "";

    // Carregar histórico de compras
    if(ordersList) await loadPurchaseHistory(user.uid);

  } else {
    window.location.href = "login.html";
  }
});

// ==========================
// FUNÇÃO HISTÓRICO DE COMPRAS
// ==========================
async function loadPurchaseHistory(uid) {
  ordersList.innerHTML = '';
  try {
    const q = query(collection(db, "purchases"), where("userId", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      ordersList.innerHTML = '<p>Ainda não há compras.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const purchase = docSnap.data();
      const div = document.createElement('div');
      div.className = 'order-item';
      div.innerHTML = `<p>Produto: ${purchase.productName} - Tamanho: ${purchase.size} - Valor: R$ ${purchase.price.toFixed(2)}</p>`;
      ordersList.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar histórico:", err);
    ordersList.innerHTML = '<p>Erro ao carregar histórico de compras.</p>';
  }
}

// ==========================
// LOGOUT
// ==========================
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

// ==========================
// VOLTAR PARA LOJA
// ==========================
if(btnBack) {
  btnBack.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// ==========================
// SALVAR ALTERAÇÕES DO USUÁRIO
// ==========================
if(userSettingsForm){
  userSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const userDocRef = doc(db, "users", currentUser.uid);

      // Atualizar nome
      if (newNameInput.value.trim() !== "") {
        await updateDoc(userDocRef, { nome: newNameInput.value.trim() });
        userNameSpan.textContent = newNameInput.value.trim();
        alert("Nome atualizado com sucesso!");
      }

      // Atualizar senha
      if (newPasswordInput.value.trim() !== "") {
        await updatePassword(currentUser, newPasswordInput.value.trim());
        alert("Senha atualizada com sucesso!");
        newPasswordInput.value = "";
      }

    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      alert("Erro ao atualizar dados: " + error.message);
    }
  });
}
