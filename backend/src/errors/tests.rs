#[cfg(test)]
mod auth_tests {
    use crate::errors::AppError;

    #[test]
    fn test_app_error_display() {
        let err = AppError::Unauthorized;
        assert_eq!(err.to_string(), "Authentication required");
    }

    #[test]
    fn test_not_found_error() {
        let err = AppError::NotFound("User".into());
        assert!(err.to_string().contains("not found"));
    }

    #[test]
    fn test_validation_error() {
        let err = AppError::Validation("Email is invalid".into());
        assert!(err.to_string().contains("Email is invalid"));
    }

    #[test]
    fn test_conflict_error() {
        let err = AppError::Conflict("Already exists".into());
        assert!(err.to_string().contains("Already exists"));
    }
}
