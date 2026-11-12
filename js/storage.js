(() => {
  const DB_NAME = "daslongo-media";
  const STORE_NAME = "profile";
  const AVATAR_KEY = "avatar";

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Rasm omborini ochib bo‘lmadi."));
    });
  }

  async function storeAvatar(blob) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(blob, AVATAR_KEY);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Profil rasmini saqlab bo‘lmadi."));
      };
    });
  }

  async function readAvatar() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(AVATAR_KEY);
      request.onsuccess = () => {
        database.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        database.close();
        reject(request.error || new Error("Profil rasmini o‘qib bo‘lmadi."));
      };
    });
  }

  async function removeAvatar() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(AVATAR_KEY);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Profil rasmini o‘chirib bo‘lmadi."));
      };
    });
  }

  window.DASLONGOStorage = { storeAvatar, readAvatar, removeAvatar };
})();
