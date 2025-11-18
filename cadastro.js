// cadastrar.js
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Salva dados no Firestore
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

    if (error.code === "auth/email-already-in-use") msg = "Email já cadastrado.";
    if (error.code === "auth/invalid-email") msg = "Email inválido.";
    if (error.code === "auth/weak-password") msg = "Senha muito fraca.";

    alert(msg + "\n" + error.message);
  }
});
