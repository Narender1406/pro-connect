# Build stage
FROM rust:1.81-alpine AS builder
RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconfig
WORKDIR /app
COPY Cargo.toml ./
# Create dummy main to cache dependencies
RUN mkdir -p src && echo "fn main(){}" > src/main.rs
RUN cargo build --release 2>/dev/null || true
RUN rm -rf src
COPY src ./src
COPY migrations ./migrations
# Set SQLX_OFFLINE so it doesn't need a live DB to compile
ENV SQLX_OFFLINE=true
RUN cargo build --release

# Runtime stage
FROM alpine:3.20
RUN apk add --no-cache libgcc ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/target/release/careertrack ./
COPY --from=builder /app/migrations ./migrations
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
EXPOSE 8080
CMD ["./careertrack"]
