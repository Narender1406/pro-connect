use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub username: String,
    pub full_name: String,
    pub role: UserRole,
    pub status: UserStatus,
    pub email_verified: bool,
    pub two_factor_enabled: bool,
    #[serde(skip_serializing)]
    pub two_factor_secret: Option<String>,
    pub avatar_url: Option<String>,
    pub cover_url: Option<String>,
    pub bio: Option<String>,
    pub headline: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
    pub github_username: Option<String>,
    pub linkedin_url: Option<String>,
    pub resume_url: Option<String>,
    pub open_to_work: bool,
    pub followers_count: i32,
    pub following_count: i32,
    pub posts_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_seen_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    User,
    Moderator,
    Admin,
    SuperAdmin,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "user_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum UserStatus {
    Active,
    Suspended,
    Deactivated,
    PendingVerification,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct UserProfile {
    pub id: Uuid,
    pub user_id: Uuid,
    pub skills: sqlx::types::Json<Vec<Skill>>,
    pub experience: sqlx::types::Json<Vec<Experience>>,
    pub education: sqlx::types::Json<Vec<Education>>,
    pub portfolio_links: sqlx::types::Json<Vec<PortfolioLink>>,
    pub profile_views: i32,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub name: String,
    pub level: SkillLevel,
    pub years: Option<f32>,
    pub endorsed_by: Vec<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SkillLevel { Beginner, Intermediate, Advanced, Expert }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Experience {
    pub id: String,
    pub company: String,
    pub title: String,
    pub location: Option<String>,
    pub start_date: String,
    pub end_date: Option<String>,
    pub current: bool,
    pub description: Option<String>,
    pub skills_used: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Education {
    pub id: String,
    pub institution: String,
    pub degree: String,
    pub field: String,
    pub start_year: i32,
    pub end_year: Option<i32>,
    pub gpa: Option<f32>,
    pub activities: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioLink {
    pub title: String,
    pub url: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Session {
    pub id: Uuid,
    pub user_id: Uuid,
    pub refresh_token_hash: String,
    pub device_name: Option<String>,
    pub device_type: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub last_used_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Post {
    pub id: Uuid,
    pub author_id: Uuid,
    pub content: String,
    pub post_type: PostType,
    pub media_urls: sqlx::types::Json<Vec<String>>,
    pub hashtags: Vec<String>,
    pub mentions: sqlx::types::Json<Vec<Uuid>>,
    pub likes_count: i32,
    pub comments_count: i32,
    pub shares_count: i32,
    pub saves_count: i32,
    pub visibility: PostVisibility,
    pub is_pinned: bool,
    pub parent_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "post_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum PostType { Text, Image, Video, Article, JobPost, Poll }

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "post_visibility", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum PostVisibility { Public, Connections, Private }

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Comment {
    pub id: Uuid,
    pub post_id: Uuid,
    pub author_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub content: String,
    pub likes_count: i32,
    pub replies_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Message {
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub content: Option<String>,
    pub message_type: MessageType,
    pub media_url: Option<String>,
    pub reply_to_id: Option<Uuid>,
    pub is_edited: bool,
    pub is_deleted: bool,
    pub read_by: sqlx::types::Json<Vec<Uuid>>,
    pub reactions: sqlx::types::Json<Vec<MessageReaction>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "message_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum MessageType { Text, Image, File, Audio, System }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageReaction {
    pub user_id: Uuid,
    pub emoji: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Conversation {
    pub id: Uuid,
    pub name: Option<String>,
    pub is_group: bool,
    pub avatar_url: Option<String>,
    pub created_by: Uuid,
    pub last_message_id: Option<Uuid>,
    pub last_message_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Organization {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub logo_url: Option<String>,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub size: Option<String>,
    pub owner_id: Uuid,
    pub members_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub status: ProjectStatus,
    pub owner_id: Uuid,
    pub due_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "project_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ProjectStatus { Active, Archived, Completed }

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Task {
    pub id: Uuid,
    pub project_id: Uuid,
    pub board_column: String,
    pub title: String,
    pub description: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub reporter_id: Uuid,
    pub priority: TaskPriority,
    pub labels: Vec<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub position: f64,
    pub estimated_hours: Option<f32>,
    pub logged_hours: Option<f32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "task_priority", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum TaskPriority { Low, Medium, High, Critical }

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub actor_id: Option<Uuid>,
    pub notification_type: NotificationType,
    pub title: String,
    pub body: String,
    pub entity_id: Option<Uuid>,
    pub entity_type: Option<String>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "notification_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum NotificationType {
    Follow, Like, Comment, Reply, Mention, Message,
    TaskAssigned, TaskDue, WorkspaceInvite, PostShare,
    ConnectionRequest, JobMatch, SystemAlert,
}
