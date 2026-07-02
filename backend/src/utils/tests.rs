#[cfg(test)]
mod tests {
    use crate::utils::{tokens, Pagination};

    #[test]
    fn test_generate_secure_token_length() {
        let token = tokens::generate_secure_token();
        assert_eq!(token.len(), 64); // 32 bytes = 64 hex chars
    }

    #[test]
    fn test_token_uniqueness() {
        let t1 = tokens::generate_secure_token();
        let t2 = tokens::generate_secure_token();
        assert_ne!(t1, t2);
    }

    #[test]
    fn test_hash_token_deterministic() {
        let token = "test_token_123";
        let h1 = tokens::hash_token(token);
        let h2 = tokens::hash_token(token);
        assert_eq!(h1, h2);
    }

    #[test]
    fn test_hash_token_different_inputs() {
        let h1 = tokens::hash_token("token_a");
        let h2 = tokens::hash_token("token_b");
        assert_ne!(h1, h2);
    }

    #[test]
    fn test_pagination_defaults() {
        let p = Pagination::new(1, 20);
        assert_eq!(p.limit, 20);
        assert_eq!(p.offset, 0);
    }

    #[test]
    fn test_pagination_offset() {
        let p = Pagination::new(3, 20);
        assert_eq!(p.offset, 40);
    }

    #[test]
    fn test_pagination_limit_cap() {
        let p = Pagination::new(1, 999);
        assert_eq!(p.limit, 100); // capped at 100
    }

    #[test]
    fn test_pagination_min_page() {
        let p = Pagination::new(0, 20);
        assert_eq!(p.offset, 0); // never negative
    }
}
