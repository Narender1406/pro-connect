use sha2::{Sha256, Digest};
use rand::{thread_rng, Rng};
use hex;

pub fn generate_secure_token() -> String {
    let bytes: Vec<u8> = (0..32).map(|_| thread_rng().gen::<u8>()).collect();
    hex::encode(bytes)
}

pub fn hash_token(token: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    hex::encode(hasher.finalize())
}
