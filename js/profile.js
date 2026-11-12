(() => {
  let currentObjectUrl = null;

  function draw(blob) {
    const image = document.getElementById("profile-avatar-image");
    const fallback = document.getElementById("profile-avatar-fallback");
    if (!image || !fallback) return;
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = blob ? URL.createObjectURL(blob) : null;
    image.classList.toggle("hidden", !currentObjectUrl);
    fallback.classList.toggle("hidden", Boolean(currentObjectUrl));
    if (currentObjectUrl) image.src = currentObjectUrl;
    else image.removeAttribute("src");
  }

  async function refreshAvatar() {
    try {
      draw(await window.DASLONGOStorage.readAvatar());
    } catch (error) {
      console.error("Profil rasmini yuklab bo‘lmadi:", error);
      window.showToast?.("Profil rasmini yuklab bo‘lmadi.");
    }
  }

  function toOptimizedImage(file) {
    return createImageBitmap(file).then(bitmap => {
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Rasmni qayta ishlash imkoni bo‘lmadi.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error("Rasmni optimallashtirib bo‘lmadi."));
        }, "image/webp", 0.86);
      });
    });
  }

  async function savePhoto(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.showToast?.("Iltimos, rasm faylini tanlang.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      window.showToast?.("Rasm hajmi 12 MB dan kichik bo‘lishi kerak.");
      return;
    }
    try {
      const image = await toOptimizedImage(file);
      await window.DASLONGOStorage.storeAvatar(image);
      draw(image);
      window.showToast?.("Profil rasmi shu qurilmada saqlandi.");
    } catch (error) {
      console.error("Profil rasmi saqlanmadi:", error);
      window.showToast?.(error.message || "Profil rasmini saqlab bo‘lmadi.");
    }
  }

  async function removePhoto() {
    try {
      await window.DASLONGOStorage.removeAvatar();
      draw(null);
      window.showToast?.("Profil rasmi olib tashlandi.");
    } catch (error) {
      console.error("Profil rasmini o‘chirib bo‘lmadi:", error);
      window.showToast?.("Profil rasmini o‘chirib bo‘lmadi.");
    }
  }

  document.addEventListener("change", event => {
    if (event.target.id !== "avatar-upload") return;
    savePhoto(event.target.files?.[0]);
    event.target.value = "";
  });
  document.addEventListener("click", event => {
    if (event.target.closest("[data-remove-avatar]")) removePhoto();
  });

  window.DASLONGOProfile = { refreshAvatar };
})();
