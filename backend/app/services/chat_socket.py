from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Map user_id -> WebSocket
        # For simplicity, assuming one connection per user for now. 
        # For multiple devices, we'd need List[WebSocket]
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_json(message)

manager = ConnectionManager()
