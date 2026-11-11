import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

(() => {
  const form = document.querySelector("#login-form");
  const identifierInput = document.querySelector("#identifier");
  const passwordInput = document.querySelector("#password");
  const toggleButton = document.querySelector("#password-toggle");
  const submitButton = document.querySelector("#login-submit");
  const message = document.querySelector("#login-message");
  const connectionNote = document.querySelector("#connection-note");
  const localDevelopmentHosts = ["localhost", "127.0.0.1", "[::1]"];
  const isSecureTransport = location.protocol === "https:" || localDevelopmentHosts.includes(location.hostname);

  if (location.protocol === "https:") {
    connectionNote.textContent = "Conexão HTTPS ativa";
  } else if (location.protocol === "file:") {
    connectionNote.textContent = "A autenticação requer um servidor web com HTTPS";
  } else if (!isSecureTransport) {
    connectionNote.textContent = "Use uma conexão HTTPS para entrar com segurança";
  }

  function showMessage(text, type = "error") {
    message.textContent = text;
    message.className = `login-message is-${type}`;
    message.hidden = false;
  }

  function clearMessage() {
    message.textContent = "";
    message.className = "login-message";
    message.hidden = true;
    identifierInput.removeAttribute("aria-invalid");
    passwordInput.removeAttribute("aria-invalid");
  }

  toggleButton.addEventListener("click", () => {
    const showing = passwordInput.type === "password";
    passwordInput.type = showing ? "text" : "password";
    toggleButton.setAttribute("aria-pressed", String(showing));
    toggleButton.setAttribute("aria-label", showing ? "Ocultar senha" : "Mostrar senha");
    toggleButton.title = showing ? "Ocultar senha" : "Mostrar senha";
    passwordInput.focus();
  });

  form.addEventListener("input", clearMessage);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();

    if (!form.reportValidity()) return;
    if (!isSecureTransport) {
      showMessage(location.protocol === "file:"
        ? "Para autenticar, abra o sistema por um servidor web com HTTPS."
        : "Por segurança, acesse o sistema por uma conexão HTTPS.");
      return;
    }

    submitButton.disabled = true;
    submitButton.querySelector(".submit-label").textContent = "Verificando...";

    try {
      await signInWithEmailAndPassword(auth, identifierInput.value.trim(), passwordInput.value);
      passwordInput.value = "";
      showMessage("Acesso confirmado. Abrindo seu quadro...", "success");
      window.location.assign("index.html");
    } catch (error) {
      if (["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password", "auth/invalid-email"].includes(error.code)) {
        identifierInput.setAttribute("aria-invalid", "true");
        passwordInput.setAttribute("aria-invalid", "true");
        passwordInput.value = "";
        showMessage("E-mail ou senha inválidos.");
        passwordInput.focus();
        return;
      }
      if (error.code === "auth/too-many-requests") {
        showMessage("Muitas tentativas. Aguarde um pouco e tente novamente.");
      } else if (error.code === "auth/network-request-failed") {
        showMessage("Não foi possível conectar ao Firebase. Verifique sua conexão.");
      } else {
        showMessage("Não foi possível entrar. Confira se o login por e-mail está ativado no Firebase.");
      }
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector(".submit-label").textContent = "Entrar";
    }
  });

  onAuthStateChanged(auth, user => {
    if (user) window.location.replace("index.html");
  });
})();
