pub struct Pagination {
    pub limit: i64,
    pub offset: i64,
}

impl Pagination {
    pub fn new(page: i64, limit: i64) -> Self {
        let limit = limit.min(100).max(1);
        let offset = ((page - 1) * limit).max(0);
        Self { limit, offset }
    }
}
