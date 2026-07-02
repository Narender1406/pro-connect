use lettre::{
    transport::smtp::authentication::Credentials,
    Message, SmtpTransport, Transport,
    message::header::ContentType,
};
use crate::config::AppConfig;

pub async fn send_verification_email(
    config: &AppConfig,
    to_email: &str,
    name: &str,
    token: &str,
) -> anyhow::Result<()> {
    let verify_url = format!("{}/verify-email/{}", config.frontend_url, token);
    let html = format!(r#"
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#6366f1">Welcome to CareerTrack, {}!</h2>
            <p>Verify your email to get started:</p>
            <a href="{}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
                Verify Email
            </a>
            <p style="color:#666;font-size:12px">Link expires in 24 hours. If you didn't register, ignore this.</p>
        </div>
    "#, name, verify_url);
    send_email(config, to_email, "Verify your CareerTrack email", &html).await
}

pub async fn send_password_reset_email(
    config: &AppConfig,
    to_email: &str,
    name: &str,
    token: &str,
) -> anyhow::Result<()> {
    let reset_url = format!("{}/reset-password/{}", config.frontend_url, token);
    let html = format!(r#"
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#6366f1">Password Reset Request</h2>
            <p>Hi {}, click below to reset your password:</p>
            <a href="{}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
                Reset Password
            </a>
            <p style="color:#666;font-size:12px">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
    "#, name, reset_url);
    send_email(config, to_email, "Reset your CareerTrack password", &html).await
}

async fn send_email(config: &AppConfig, to: &str, subject: &str, html: &str) -> anyhow::Result<()> {
    let email = Message::builder()
        .from(format!("CareerTrack <{}>", config.smtp_from).parse()?)
        .to(to.parse()?)
        .subject(subject)
        .header(ContentType::TEXT_HTML)
        .body(html.to_string())?;

    let creds = Credentials::new(config.smtp_user.clone(), config.smtp_pass.clone());
    let mailer = SmtpTransport::starttls_relay(&config.smtp_host)?
        .credentials(creds)
        .port(config.smtp_port)
        .build();

    tokio::task::spawn_blocking(move || mailer.send(&email)).await??;
    Ok(())
}
