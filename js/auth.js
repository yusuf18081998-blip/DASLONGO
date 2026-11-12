(() => {
  let client = null;
  let onSessionChange = () => {};
  let mode = "login";

  const status = (message, isError = false) => {
    const element = document.getElementById("auth-status");
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("error", isError);
    element.classList.toggle("success", !isError && Boolean(message));
  };

  function configured() {
    const config = window.DASLONGO_CONFIG;
    return Boolean(
      config?.supabaseUrl &&
      config?.supabaseAnonKey &&
      window.supabase?.createClient
    );
  }

  function setMode(nextMode) {
    mode = nextMode;
    const signup = mode === "signup";
    document.getElementById("auth-title").textContent = signup ? "Hisob yarating" : "Hisobingizga kiring";
    document.getElementById("auth-description").textContent = signup
      ? "DASLONGO profilingiz va progressni boshlang."
      : "O‘rganishni davom ettirish uchun tizimga kiring.";
    document.getElementById("auth-submit").textContent = signup ? "Ro‘yxatdan o‘tish" : "Kirish";
    document.getElementById("auth-name-field").classList.toggle("hidden", !signup);
    document.getElementById("auth-name").required = signup;
    document.getElementById("auth-switch-label").textContent = signup
      ? "Hisobingiz bormi?"
      : "Yangi foydalanuvchimisiz?";
    document.getElementById("auth-switch").textContent = signup ? "Kirish" : "Ro‘yxatdan o‘tish";
    document.getElementById("auth-password").minLength = signup ? 8 : 1;
    document.getElementById("auth-password").placeholder = signup ? "Kamida 8 ta belgi" : "Parolingiz";
    status("");
  }

  function open(nextMode = "login") {
    setMode(nextMode);
    document.getElementById("auth-modal").classList.remove("hidden");
  }

  function close() {
    document.getElementById("auth-modal").classList.add("hidden");
    status("");
  }

  function unavailableMessage() {
    return "Kirishni yoqish uchun js/config.js faylida Supabase URL va anon key sozlang.";
  }

  async function submitEmail(event) {
    event.preventDefault();
    if (!configured()) {
      status(unavailableMessage(), true);
      return;
    }

    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const name = document.getElementById("auth-name").value.trim();
    const submit = document.getElementById("auth-submit");
    submit.disabled = true;
    status("Tekshirilmoqda…");
    try {
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        if (!data.session) {
          status("Hisob yaratildi. Kirishdan oldin emailingizni tasdiqlang.");
          return;
        }
        status("Hisob yaratildi.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        status("Muvaffaqiyatli kirdingiz.");
        window.showToast?.("DASLONGO hisobingizga kirdingiz.");
        window.setTimeout(close, 900);
      }
    } catch (error) {
      console.error("Email orqali autentifikatsiya bajarilmadi:", error);
      status(error.message || "Kirish amalga oshmadi. Ma’lumotlaringizni tekshiring.", true);
    } finally {
      submit.disabled = false;
    }
  }

  async function signInWithProvider(provider) {
    if (!configured()) {
      status(unavailableMessage(), true);
      return;
    }
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.href.split("#")[0] }
      });
      if (error) throw error;
    } catch (error) {
      console.error(`${provider} orqali kirish amalga oshmadi:`, error);
      status(error.message || `${provider} orqali kirib bo‘lmadi. OAuth sozlamalarini tekshiring.`, true);
    }
  }

  async function signOut() {
    if (!client) {
      status(unavailableMessage(), true);
      return;
    }
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Hisobdan chiqib bo‘lmadi:", error);
      window.showToast?.(error.message || "Hisobdan chiqib bo‘lmadi.");
    }
  }

  function init(callback) {
    onSessionChange = callback;
    if (!configured()) {
      document.querySelectorAll("[data-auth-provider]").forEach(button => {
        button.disabled = true;
        button.title = "OAuth uchun Supabase loyihasi va provayder sozlamasi kerak.";
      });
      return;
    }

    const { supabaseUrl, supabaseAnonKey } = window.DASLONGO_CONFIG;
    client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    client.auth.onAuthStateChange((_event, session) => {
      onSessionChange(session?.user || null);
    });
    client.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Saqlangan hisob seansini tekshirib bo‘lmadi:", error);
        status("Saqlangan hisobni tekshirib bo‘lmadi.", true);
        return;
      }
      onSessionChange(data.session?.user || null);
    }).catch(error => {
      console.error("Saqlangan hisob seansini tekshirib bo‘lmadi:", error);
      status(error.message || "Saqlangan hisobni tekshirib bo‘lmadi.", true);
    });
  }

  document.getElementById("auth-form").addEventListener("submit", submitEmail);
  document.getElementById("auth-close").addEventListener("click", close);
  document.getElementById("auth-switch").addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));
  document.querySelectorAll("[data-auth-provider]").forEach(button => {
    button.addEventListener("click", () => signInWithProvider(button.dataset.authProvider));
  });
  document.getElementById("auth-modal").addEventListener("click", event => {
    if (event.target.id === "auth-modal") close();
  });

  window.DASLONGOAuth = { init, open, close, signOut, isConfigured: configured };
})();
