// login.js
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login realizado com sucesso!");
    window.location.href = "index.html";

  } catch (error) {
    console.error("Erro no login:", error);
    let msg = "Erro ao fazer login.";

    if (error.code === "auth/user-not-found") msg = "Usuário não encontrado.";
    if (error.code === "auth/wrong-password") msg = "Senha incorreta.";
    if (error.code === "auth/invalid-email") msg = "Email inválido.";

    alert(msg + "\n" + error.message);
  }
});
