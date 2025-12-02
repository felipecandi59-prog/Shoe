// ==========================
// CARRINHO
// ==========================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartBody = document.getElementById("cartBody");
const cartTable = document.getElementById("cartTable");
const emptyMessage = document.getElementById("emptyMessage");
const paymentTotal = document.getElementById("paymentTotal");
const paymentMethod = document.getElementById("paymentMethod");
const pixDetails = document.getElementById("pixDetails");
const cardDetails = document.getElementById("cardDetails");
const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");

// ==========================
// FUNÇÃO RENDER CARRINHO
// ==========================
function renderCart() {
  cartBody.innerHTML = "";
  if (cart.length === 0) {
    cartTable.style.display = "none";
    emptyMessage.style.display = "block";
    paymentTotal.textContent = "0.00";
    return;
  }

  cartTable.style.display = "table";
  emptyMessage.style.display = "none";

  let total = 0;
  cart.forEach((item, index) => {
    const itemTotal = item.price * (item.quantity || 1);
    total += itemTotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.size}</td>
      <td>R$ ${item.price.toFixed(2)}</td>
      <td>
        <input type="number" min="1" value="${item.quantity || 1}" style="width:50px;" data-index="${index}" class="qtyInput">
      </td>
      <td>R$ ${itemTotal.toFixed(2)}</td>
      <td><button class="btn-secondary removeBtn" data-index="${index}">X</button></td>
    `;
    cartBody.appendChild(tr);
  });

  paymentTotal.textContent = total.toFixed(2);

  // ADICIONAR EVENTOS DE REMOVER
  document.querySelectorAll(".removeBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.dataset.index;
      cart.splice(idx, 1);
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });

  // EVENTOS DE ALTERAR QUANTIDADE
  document.querySelectorAll(".qtyInput").forEach(input => {
    input.addEventListener("change", (e) => {
      const idx = e.target.dataset.index;
      const qty = parseInt(e.target.value);
      if (qty < 1) e.target.value = 1;
      cart[idx].quantity = qty;
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });
}

// ==========================
// MOSTRAR MÉTODO DE PAGAMENTO
// ==========================
paymentMethod.addEventListener("change", () => {
  if (paymentMethod.value === "pix") {
    pixDetails.style.display = "block";
    cardDetails.style.display = "none";
  } else if (paymentMethod.value === "card") {
    cardDetails.style.display = "block";
    pixDetails.style.display = "none";
  } else {
    pixDetails.style.display = "none";
    cardDetails.style.display = "none";
  }
});

// ==========================
// CONFIRMAR PAGAMENTO
// ==========================
confirmPaymentBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (cart.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  alert("Pagamento confirmado!\nTotal: R$ " + paymentTotal.textContent);
  cart = [];
  localStorage.removeItem("cart");
  renderCart();
});

// ==========================
// INICIALIZAÇÃO
// ==========================
renderCart();
