// cadastro.js
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Seleciona o formulário pelo ID correto
const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Pega valores dos inputs corretos
  const name = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validação simples de senha
  if (password !== confirmPassword) {
    alert("As senhas não conferem!");
    return;
  }

  try {
    // Cria usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Salva dados do usuário no Firestore
    await setDoc(doc(db, "users", user.uid), {
      nome: name,
      email: email,
      createdAt: new Date(),
      admin: false
    });

    alert("Cadastro realizado com sucesso!");
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("Erro no cadastro:", error);

    let msg = "Erro ao cadastrar.";

    // Mensagens amigáveis para alguns erros comuns
    if (error.code === "auth/email-already-in-use") msg = "Email já cadastrado.";
    if (error.code === "auth/invalid-email") msg = "Email inválido.";
    if (error.code === "auth/weak-password") msg = "Senha muito fraca.";

    alert(msg + "\n" + error.message);
  }
});
