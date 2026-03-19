from typing import Dict, List
from fastapi import WebSocket

class NotificationConnectionManager:
    def __init__(self):
        # Map user_id -> List[WebSocket] to support multi-device
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_notification(self, notification_data: dict, user_id: int):
        if user_id in self.active_connections:
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(notification_data)
                except Exception:
                    # Connection might be stale
                    pass

notification_manager = NotificationConnectionManager()
