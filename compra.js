// ===========================
// IMPORTS FIREBASE
// ===========================
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ===========================
// ELEMENTOS
// ===========================
const customerName = document.getElementById("customerName");
const paymentTotal = document.getElementById("paymentTotal");
const paymentMethod = document.getElementById("paymentMethod");

const pixDetails = document.getElementById("pixDetails");
const cardDetails = document.getElementById("cardDetails");

const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
const loader = document.getElementById("loader");
const successCheck = document.getElementById("successCheck");

// ===========================
// CARREGAR CARRINHO
// ===========================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function updateTotal() {
  if (cart.length === 0) {
    paymentTotal.textContent = "0.00";
    return;
  }

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  paymentTotal.textContent = total.toFixed(2);
}

// ===========================
// DETECTAR LOGIN
// ===========================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    customerName.textContent = "Visitante";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (snap.exists()) {
    customerName.textContent = snap.data().nome || "Usuário";
  }
});

// ===========================
// MÉTODO DE PAGAMENTO
// ===========================
paymentMethod.addEventListener("change", () => {
  pixDetails.style.display = paymentMethod.value === "pix" ? "block" : "none";
  cardDetails.style.display = paymentMethod.value === "card" ? "block" : "none";
});

// ===========================
// CONFIRMAR PAGAMENTO
// ===========================
confirmPaymentBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  if (!paymentMethod.value) {
    alert("Selecione um método de pagamento.");
    return;
  }

  loader.style.display = "block";

  setTimeout(async () => {
    loader.style.display = "none";
    successCheck.style.display = "block";

    // SALVAR PEDIDO NO FIRESTORE
    try {
      await addDoc(collection(db, "purchases"), {
        items: cart,
        total: cart.reduce((acc, item) => acc + item.price, 0),
        paymentMethod: paymentMethod.value,
        createdAt: new Date(),
        user: auth.currentUser ? auth.currentUser.uid : "visitante"
      });

      // limpa carrinho
      localStorage.removeItem("cart");

    } catch (e) {
      console.error("Erro ao salvar pedido:", e);
    }

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  }, 1500);
});

// ===========================
// INICIAR
// ===========================
updateTotal();
