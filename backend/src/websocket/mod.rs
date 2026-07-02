use axum::{Router, extract::{State, WebSocketUpgrade, ws::{WebSocket, Message as WsMessage}}, routing::get, response::IntoResponse};
use dashmap::DashMap;
use futures::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;
use serde::{Serialize, Deserialize};
use crate::api::AppState;

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "event", content = "data")]
pub enum WsEvent {
    NewMessage(serde_json::Value),
    MessageEdited(serde_json::Value),
    MessageDeleted(serde_json::Value),
    TypingStart { conversation_id: Uuid, user_id: Uuid },
    TypingStop { conversation_id: Uuid, user_id: Uuid },
    UserOnline { user_id: Uuid },
    UserOffline { user_id: Uuid },
    Notification(serde_json::Value),
    PostLiked { post_id: Uuid, likes_count: i32 },
    TaskUpdated(serde_json::Value),
    MessageReaction(serde_json::Value),
}

#[derive(Deserialize)]
struct WsAuth {
    token: String,
}

pub struct WsState {
    user_senders: DashMap<Uuid, broadcast::Sender<WsEvent>>,
    conversation_senders: DashMap<Uuid, broadcast::Sender<WsEvent>>,
}

impl WsState {
    pub fn new() -> Self {
        Self {
            user_senders: DashMap::new(),
            conversation_senders: DashMap::new(),
        }
    }

    pub fn subscribe_user(&self, user_id: Uuid) -> broadcast::Receiver<WsEvent> {
        self.user_senders
            .entry(user_id)
            .or_insert_with(|| broadcast::channel(64).0)
            .subscribe()
    }

    pub fn subscribe_conversation(&self, conv_id: Uuid) -> broadcast::Receiver<WsEvent> {
        self.conversation_senders
            .entry(conv_id)
            .or_insert_with(|| broadcast::channel(128).0)
            .subscribe()
    }

    pub async fn send_to_user(&self, user_id: Uuid, event: WsEvent) {
        if let Some(tx) = self.user_senders.get(&user_id) {
            tx.send(event).ok();
        }
    }

    pub async fn broadcast_to_conversation(&self, conv_id: Uuid, event: WsEvent) {
        if let Some(tx) = self.conversation_senders.get(&conv_id) {
            tx.send(event).ok();
        }
    }

    pub fn remove_user(&self, user_id: Uuid) {
        self.user_senders.remove(&user_id);
    }
}

pub fn routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(ws_handler))
        .with_state(state)
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    axum::extract::Query(auth): axum::extract::Query<WsAuth>,
) -> impl IntoResponse {
    let user_id = validate_ws_token(&state, &auth.token);
    ws.on_upgrade(move |socket| handle_ws(socket, state, user_id))
}

fn validate_ws_token(state: &AppState, token: &str) -> Option<Uuid> {
    use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
    use crate::middleware::auth::Claims;
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    ).ok().map(|d| d.claims.sub)
}

async fn handle_ws(socket: WebSocket, state: AppState, user_id: Option<Uuid>) {
    let user_id = match user_id {
        Some(id) => id,
        None => return,
    };

    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<WsEvent>();

    // Subscribe user channel and forward to mpsc
    let mut user_rx = state.ws_state.subscribe_user(user_id);
    let tx1 = tx.clone();
    tokio::spawn(async move {
        while let Ok(event) = user_rx.recv().await {
            if tx1.send(event).is_err() { break; }
        }
    });

    state.ws_state.send_to_user(user_id, WsEvent::UserOnline { user_id }).await;

    let send_task = tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            let json = serde_json::to_string(&event).unwrap_or_default();
            if sender.send(WsMessage::Text(json)).await.is_err() { break; }
        }
    });

    let ws_state = state.ws_state.clone();
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                WsMessage::Text(text) => {
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&text) {
                        handle_client_message(&ws_state, user_id, parsed, tx.clone()).await;
                    }
                }
                WsMessage::Close(_) => break,
                _ => {}
            }
        }
    });

    tokio::select! {
        _ = send_task => {}
        _ = recv_task => {}
    }

    state.ws_state.remove_user(user_id);
}

async fn handle_client_message(
    ws_state: &Arc<WsState>,
    user_id: Uuid,
    msg: serde_json::Value,
    tx: tokio::sync::mpsc::UnboundedSender<WsEvent>,
) {
    match msg["type"].as_str() {
        Some("typing_start") => {
            if let Some(conv_id) = msg["conversation_id"].as_str().and_then(|s| s.parse::<Uuid>().ok()) {
                ws_state.broadcast_to_conversation(conv_id, WsEvent::TypingStart { conversation_id: conv_id, user_id }).await;
            }
        }
        Some("typing_stop") => {
            if let Some(conv_id) = msg["conversation_id"].as_str().and_then(|s| s.parse::<Uuid>().ok()) {
                ws_state.broadcast_to_conversation(conv_id, WsEvent::TypingStop { conversation_id: conv_id, user_id }).await;
            }
        }
        Some("join_conversation") => {
            if let Some(conv_id) = msg["conversation_id"].as_str().and_then(|s| s.parse::<Uuid>().ok()) {
                let mut conv_rx = ws_state.subscribe_conversation(conv_id);
                tokio::spawn(async move {
                    while let Ok(event) = conv_rx.recv().await {
                        if tx.send(event).is_err() { break; }
                    }
                });
            }
        }
        _ => {}
    }
}
