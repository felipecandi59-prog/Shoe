// dashboard.js
import { auth, db } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Verifica se usuário está logado
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const docUser = await getDoc(doc(db, "users", user.uid));
    const userData = docUser.data();
    document.getElementById("userName").textContent = userData?.nome || "Usuário";
  } else {
    window.location.href = "login.html";
  }
});

// Logout
document.getElementById("btnLogout").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
