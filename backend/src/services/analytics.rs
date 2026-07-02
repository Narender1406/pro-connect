use sqlx::PgPool;
use uuid::Uuid;
use crate::errors::Result;

pub async fn user_analytics(db: &PgPool, user_id: Uuid, period: &str) -> Result<serde_json::Value> {
    let days: i32 = match period { "7d" => 7, "90d" => 90, _ => 30 };
    let interval = format!("{} days", days);
    let profile_views: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM profile_views WHERE profile_id=$1 AND created_at > NOW() - $2::interval"
    ).bind(user_id).bind(&interval).fetch_one(db).await.unwrap_or(0);
    let post_likes: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(likes_count), 0) FROM posts WHERE author_id=$1 AND created_at > NOW() - $2::interval"
    ).bind(user_id).bind(&interval).fetch_one(db).await.unwrap_or(0);
    let new_followers: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM follows WHERE following_id=$1 AND created_at > NOW() - $2::interval"
    ).bind(user_id).bind(&interval).fetch_one(db).await.unwrap_or(0);
    let posts_published: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM posts WHERE author_id=$1 AND created_at > NOW() - $2::interval"
    ).bind(user_id).bind(&interval).fetch_one(db).await.unwrap_or(0);
    Ok(serde_json::json!({
        "period": period, "profile_views": profile_views, "post_likes": post_likes,
        "new_followers": new_followers, "posts_published": posts_published
    }))
}

pub async fn workspace_analytics(db: &PgPool, ws_id: Uuid, period: &str) -> Result<serde_json::Value> {
    let total_members: i64 = sqlx::query_scalar("SELECT members_count FROM organizations WHERE id=$1").bind(ws_id).fetch_one(db).await.unwrap_or(0);
    let total_projects: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM projects WHERE workspace_id=$1").bind(ws_id).fetch_one(db).await.unwrap_or(0);
    let total_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks t JOIN projects p ON p.id=t.project_id WHERE p.workspace_id=$1").bind(ws_id).fetch_one(db).await.unwrap_or(0);
    let completed_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks t JOIN projects p ON p.id=t.project_id WHERE p.workspace_id=$1 AND t.board_column='done'").bind(ws_id).fetch_one(db).await.unwrap_or(0);
    Ok(serde_json::json!({
        "period": period, "total_members": total_members, "total_projects": total_projects,
        "total_tasks": total_tasks, "completed_tasks": completed_tasks,
        "completion_rate": if total_tasks > 0 { (completed_tasks as f64 / total_tasks as f64 * 100.0).round() } else { 0.0 }
    }))
}

pub async fn engagement_stats(db: &PgPool, user_id: Uuid) -> Result<serde_json::Value> {
    let total_posts: i32 = sqlx::query_scalar("SELECT posts_count FROM users WHERE id=$1").bind(user_id).fetch_one(db).await.unwrap_or(0);
    let total_followers: i32 = sqlx::query_scalar("SELECT followers_count FROM users WHERE id=$1").bind(user_id).fetch_one(db).await.unwrap_or(0);
    let total_following: i32 = sqlx::query_scalar("SELECT following_count FROM users WHERE id=$1").bind(user_id).fetch_one(db).await.unwrap_or(0);
    let total_likes_received: i64 = sqlx::query_scalar("SELECT COALESCE(SUM(likes_count), 0) FROM posts WHERE author_id=$1").bind(user_id).fetch_one(db).await.unwrap_or(0);
    Ok(serde_json::json!({
        "total_posts": total_posts, "total_followers": total_followers,
        "total_following": total_following, "total_likes_received": total_likes_received
    }))
}
