export async function encryptAndSendTicket(transactionData, txPassword) {
  function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  function base64ToUint8Array(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  }

  // Step 1: 產生 AES-GCM Session Key
  const sessionKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Step 2: 加密交易資料
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode("movie-ticket-auth");
  const encodedData = new TextEncoder().encode(JSON.stringify(transactionData));

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

  // Step 3: 將 sessionKey 匯出 raw bytes 並傳給後端請求 KMS 加密
  const rawSessionKey = await window.crypto.subtle.exportKey("raw", sessionKey);
  const sessionKeyBase64 = arrayBufferToBase64(rawSessionKey);

  const res = await fetch("http://127.0.0.1:5000/kms/encrypt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_key: sessionKeyBase64 })
  });

  const result = await res.json();
  const encryptedSessionKey = result.encrypted_session_key;

  // Step 4: 組合 Payload 傳送到 submit-ticket
  const privateKeyRaw = localStorage.getItem("privateKey");
  const raw = Uint8Array.from(atob(privateKeyRaw), c => c.charCodeAt(0));
  const privateKey = await window.crypto.subtle.importKey(
    "pkcs8", raw,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const transactionPayload = JSON.stringify(transactionData);
  const signature = await window.crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    new TextEncoder().encode(transactionPayload)
  );
  const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

  const payload = {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    aad: arrayBufferToBase64(aad),
    encryptedSessionKey: encryptedSessionKey,
    
    signature: signatureHex,
    username: localStorage.getItem("username"),       // 請在登入時記得設這個
    tx_password: txPassword,                          // 使用者輸入的交易密碼
    transactionPayload,
    transactionData
  };

  await fetch("http://127.0.0.1:5000/submit-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}