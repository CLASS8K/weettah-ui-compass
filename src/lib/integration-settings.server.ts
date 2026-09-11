const encoder = new TextEncoder();
const decoder = new TextDecoder();

type CredentialMap = Record<string, string>;

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

async function encryptionKey() {
  const secret = process.env["ADMIN_CREDENTIAL_ENCRYPTION_KEY"];
  if (!secret) throw new Error("Credential encryption is not configured");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptCredentials(credentials: CredentialMap) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    encoder.encode(JSON.stringify(credentials)),
  );
  return `${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
}

export async function decryptCredentials(value: string | null): Promise<CredentialMap> {
  if (!value) return {};
  const [ivValue, encryptedValue] = value.split(".");
  if (!ivValue || !encryptedValue) throw new Error("Stored credentials are invalid");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ivValue) },
    await encryptionKey(),
    fromBase64(encryptedValue),
  );
  return JSON.parse(decoder.decode(decrypted)) as CredentialMap;
}

export async function getIntegrationSettings(id: "esim_access") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("integration_settings").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new Error("Integration settings not found");
  return { ...data, credentials: await decryptCredentials(data.encrypted_credentials) };
}