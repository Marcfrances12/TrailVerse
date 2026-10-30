const crypto = require("crypto");
const argon2 = require("argon2");

const ARGON2_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1
});

const LEGACY_SCRYPT_OPTIONS = Object.freeze({
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
});
const LEGACY_HASH_BYTES = 64;

function scrypt(password, salt, keyLength) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, LEGACY_SCRYPT_OPTIONS, (error, key) => {
      if (error) return reject(error);
      resolve(key);
    });
  });
}

async function hashPassword(password) {
  if (typeof password !== "string") {
    throw new TypeError("La contraseña debe ser texto");
  }

  return argon2.hash(password, ARGON2_OPTIONS);
}

async function verifyLegacyScrypt(password, encodedHash) {
  const separator = encodedHash.indexOf(":");
  if (separator <= 0 || separator !== encodedHash.lastIndexOf(":")) return false;

  const salt = encodedHash.slice(0, separator);
  const hashHex = encodedHash.slice(separator + 1);
  if (!/^[a-f\d]{32}$/i.test(salt) || !/^[a-f\d]{128}$/i.test(hashHex)) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, salt, LEGACY_HASH_BYTES);
  return crypto.timingSafeEqual(actual, expected);
}

async function verifyPassword(password, encodedHash) {
  if (typeof password !== "string" || typeof encodedHash !== "string") return false;

  if (encodedHash.startsWith("$argon2id$")) {
    try {
      return await argon2.verify(encodedHash, password);
    } catch {
      return false;
    }
  }

  try {
    return await verifyLegacyScrypt(password, encodedHash);
  } catch {
    return false;
  }
}

function needsRehash(encodedHash) {
  if (typeof encodedHash !== "string" || !encodedHash.startsWith("$argon2id$")) {
    return true;
  }

  try {
    return argon2.needsRehash(encodedHash, ARGON2_OPTIONS);
  } catch {
    return true;
  }
}

module.exports = { hashPassword, verifyPassword, needsRehash };
