// dashboard.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Elementos DOM
const userNameSpan = document.getElementById("userName");
const btnLogout = document.getElementById("btnLogout");
const btnBack = document.getElementById("btnBack");
const userSettingsForm = document.getElementById("user-settings-form");
const newNameInput = document.getElementById("newName");
const newPasswordInput = document.getElementById("newPassword");
const ordersList = document.getElementById("orders-list");

// Foto de perfil
const profilePhotoInput = document.getElementById('profilePhoto');
const profilePreview = document.getElementById('profilePreview');

profilePhotoInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(file) {
      const reader = new FileReader();
      reader.onload = function(event) {
          profilePreview.src = event.target.result;
      }
      reader.readAsDataURL(file);
  }
});

// Usuário atual
let currentUser = null;

// Verifica login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    const docUser = await getDoc(doc(db, "users", user.uid));
    const userData = docUser.exists() ? docUser.data() : null;

    userNameSpan.textContent = userData?.nome || user.email;
    if(newNameInput) newNameInput.value = userData?.nome || "";
    
    // Se tiver foto no banco, carregar
    if(userData?.profilePhoto) profilePreview.src = userData.profilePhoto;

    if(ordersList) await loadPurchaseHistory(user.uid);

  } else {
    window.location.href = "login.html";
  }
});

// Histórico de compras
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

// Logout
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

// Voltar para loja
btnBack?.addEventListener("click", () => {
  window.location.href = "index.html";
});

// Salvar alterações
userSettingsForm?.addEventListener("submit", async (e) => {
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

    // Salvar foto de perfil no Firestore (opcional)
    if(profilePreview.src && !profilePreview.src.includes('default-profile.png')) {
      await updateDoc(userDocRef, { profilePhoto: profilePreview.src });
    }

  } catch (error) {
    console.error("Erro ao atualizar dados:", error);
    alert("Erro ao atualizar dados: " + error.message);
  }
});
