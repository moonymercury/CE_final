// ticket_encryption.js
export async function encryptAndSendTicket(transactionData, rsaPublicKeyPem) {
  function pemToArrayBuffer(pem) {
    const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
    const binary = atob(b64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
    return buffer;
  }

  function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  const sessionKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const encodedData = new TextEncoder().encode(JSON.stringify(transactionData));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode("movie-ticket-auth");

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: aad,
      tagLength: 128,
    },
    sessionKey,
    encodedData
  );

  const rsaPublicKey = await window.crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(rsaPublicKeyPem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );

  const rawSessionKey = await window.crypto.subtle.exportKey("raw", sessionKey);
  const encryptedSessionKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaPublicKey,
    rawSessionKey
  );

  const payload = {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    aad: arrayBufferToBase64(aad),
    encryptedSessionKey: arrayBufferToBase64(encryptedSessionKey)
  };

  await fetch("http://127.0.0.1:5000/submit-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}