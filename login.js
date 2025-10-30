// ===============================
// Login - Ande firme com qualidade
// ===============================

// URL base do json-server
// =======================
// Configuração da API
// =======================
let API = "";

// Detecta se está rodando localmente (localhost) ou online
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    API = "http://localhost:3000"; // JSON Server local
} else {
    API = "https://shoe-jtqx.onrender.com"; // JSON remoto no Render
}

console.log("API usada:", API);



// Função principal: inicializa a página de login
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");

  // Garante que o formulário existe na página
  if (!loginForm) return;

  // Evento de envio do formulário
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Verificação simples
    if (!email || !password) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      // Busca usuário no banco JSON
      const response = await fetch(`${API}/users?email=${email}&password=${password}`);
      const users = await response.json();

      // Verifica se encontrou o usuário
      if (users.length === 0) {
        alert("Email ou senha incorretos!");
        return;
      }

      const user = users[0];

      // Verifica se o usuário está ativo
      if (!user.active) {
        alert("Sua conta está desativada. Contate o administrador.");
        return;
      }

      // Armazena o usuário logado localmente
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Redireciona de acordo com o tipo de usuário
      if (user.email === "admin@admin.com") {
        window.location.href = "painel-admin.html";
      } else {
        window.location.href = "index.html";
      }

    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Erro ao conectar ao servidor. Verifique se o servidor JSON está ativo.");
    }
  });
});
