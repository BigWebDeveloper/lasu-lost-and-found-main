import crypto from "crypto";

export const generateToken = () => {
  return crypto.randomBytes(32).toString("base64url");
};

export const tokenDigest = (token) => {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
};

export const compareToken = (token, storedHash) => {
  const incomingHash = Buffer.from(tokenDigest(token), "hex");
  const savedHash = Buffer.from(storedHash, "hex");

  return (
    incomingHash.length === savedHash.length &&
    crypto.timingSafeEqual(incomingHash, savedHash)
  );
};
