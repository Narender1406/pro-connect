use axum::{Router, Json, extract::State, routing::{get, post}};
use serde::{Deserialize, Serialize};
use crate::api::AppState;
use crate::errors::Result;
use crate::middleware::auth::AuthUser;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/chat", post(ai_chat))
        .route("/write-post", post(write_post))
        .route("/resume-review", post(resume_review))
        .route("/meeting-summary", post(meeting_summary))
        .route("/suggest-tasks", post(suggest_tasks))
        .route("/search", get(smart_search))
}

#[derive(Deserialize)]
struct ChatRequest {
    message: String,
    history: Vec<ChatMessage>,
}

#[derive(Deserialize, Serialize, Clone)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct WritePostRequest {
    topic: String,
    tone: Option<String>,
}

#[derive(Deserialize)]
struct ResumeReviewRequest {
    resume_url: String,
}

#[derive(Deserialize)]
struct MeetingSummaryRequest {
    transcript: String,
}

#[derive(Deserialize)]
struct TaskSuggestionRequest {
    project_description: String,
}

#[derive(Deserialize)]
struct SmartSearchQuery {
    q: String,
}

async fn ai_chat(
    State(state): State<AppState>,
    _auth: AuthUser,
    Json(req): Json<ChatRequest>,
) -> Result<Json<serde_json::Value>> {
    // Stub: In production, integrate with OpenAI/Anthropic/Bedrock
    let reply = generate_ai_response(&req.message, &state.config.frontend_url);
    Ok(Json(serde_json::json!({ "reply": reply })))
}

async fn write_post(
    _auth: AuthUser,
    Json(req): Json<WritePostRequest>,
) -> Result<Json<serde_json::Value>> {
    let tone = req.tone.as_deref().unwrap_or("professional");
    let draft = format!(
        "🚀 Excited to share insights about {}!\n\nIn today's fast-moving landscape, {} is more important than ever. Here's what I've learned...\n\n[AI-generated draft — customize to your voice]\n\n#CareerGrowth #Professional",
        req.topic, req.topic
    );
    Ok(Json(serde_json::json!({ "draft": draft, "tone": tone })))
}

async fn resume_review(
    _auth: AuthUser,
    Json(req): Json<ResumeReviewRequest>,
) -> Result<Json<serde_json::Value>> {
    Ok(Json(serde_json::json!({
        "score": 78,
        "feedback": [
            { "category": "Summary", "score": 85, "suggestion": "Strong headline. Consider adding quantified achievements." },
            { "category": "Skills", "score": 90, "suggestion": "Good technical skills listed. Add soft skills section." },
            { "category": "Experience", "score": 70, "suggestion": "Use action verbs. Quantify impact with metrics." },
            { "category": "Education", "score": 80, "suggestion": "Relevant degree listed. Add relevant coursework or certifications." }
        ],
        "ats_compatible": true,
        "keywords_missing": ["cloud", "agile", "CI/CD"]
    })))
}

async fn meeting_summary(
    _auth: AuthUser,
    Json(req): Json<MeetingSummaryRequest>,
) -> Result<Json<serde_json::Value>> {
    let words: Vec<&str> = req.transcript.split_whitespace().collect();
    Ok(Json(serde_json::json!({
        "summary": format!("Meeting covered {} topics. Key decisions were made regarding project timeline and resource allocation.", words.len() / 50 + 1),
        "action_items": [
            "Follow up with team on blockers",
            "Update project board with new tasks",
            "Schedule next review in 2 weeks"
        ],
        "duration_estimate": format!("{} minutes", words.len() / 130 + 1)
    })))
}

async fn suggest_tasks(
    _auth: AuthUser,
    Json(req): Json<TaskSuggestionRequest>,
) -> Result<Json<serde_json::Value>> {
    Ok(Json(serde_json::json!({
        "tasks": [
            { "title": "Set up project structure", "priority": "high", "column": "todo" },
            { "title": "Define API contracts", "priority": "high", "column": "todo" },
            { "title": "Design database schema", "priority": "high", "column": "todo" },
            { "title": "Implement authentication", "priority": "medium", "column": "todo" },
            { "title": "Write unit tests", "priority": "medium", "column": "todo" },
            { "title": "Set up CI/CD pipeline", "priority": "low", "column": "todo" },
            { "title": "Write documentation", "priority": "low", "column": "todo" }
        ]
    })))
}

async fn smart_search(
    _auth: AuthUser,
    axum::extract::Query(q): axum::extract::Query<SmartSearchQuery>,
) -> Result<Json<serde_json::Value>> {
    Ok(Json(serde_json::json!({
        "query": q.q,
        "intent": "job_search",
        "suggestions": [
            format!("{} jobs near you", q.q),
            format!("{} professionals to connect with", q.q),
            format!("Latest {} trends", q.q)
        ]
    })))
}

fn generate_ai_response(message: &str, _frontend_url: &str) -> String {
    // Stub response — replace with actual LLM API call
    let msg_lower = message.to_lowercase();
    if msg_lower.contains("resume") || msg_lower.contains("cv") {
        "I can help you improve your resume! Key tips: 1) Use strong action verbs, 2) Quantify achievements with metrics, 3) Tailor keywords to the job description, 4) Keep it to 1-2 pages. Would you like me to review a specific section?".into()
    } else if msg_lower.contains("post") || msg_lower.contains("write") {
        "Great idea! For an engaging professional post: Start with a hook, share a personal insight or story, add value with tips or lessons learned, and end with a question to spark engagement. What topic would you like to write about?".into()
    } else if msg_lower.contains("interview") {
        "For technical interviews: 1) Practice data structures & algorithms on LeetCode, 2) Prepare STAR-format behavioral stories, 3) Research the company's tech stack, 4) Prepare thoughtful questions to ask. Which type of interview are you preparing for?".into()
    } else if msg_lower.contains("job") || msg_lower.contains("career") {
        "Career growth comes from intentional skill building and networking. Focus on: building a strong portfolio, contributing to open source, attending tech meetups, and consistently sharing your work online. What's your current career goal?".into()
    } else {
        format!("That's a great question about \"{}\"! I'm here to help with career advice, resume reviews, post writing, project planning, and more. How can I assist you today?", message)
    }
}
