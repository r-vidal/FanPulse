"""WebSocket Connection Manager for Real-time Alerts"""
import logging
import json
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time alerts

    Handles multiple concurrent connections per user and broadcasts
    alerts to specific users or all connected clients.
    """

    def __init__(self):
        # Store active connections: {user_id: Set[WebSocket]}
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store connection metadata: {websocket_id: user_info}
        self.connection_metadata: Dict[int, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """
        Accept and register a new WebSocket connection

        Args:
            websocket: WebSocket connection object
            user_id: User UUID
        """
        await websocket.accept()

        # Initialize user's connection set if needed
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()

        # Add connection
        self.active_connections[user_id].add(websocket)

        # Store metadata
        self.connection_metadata[id(websocket)] = {
            "user_id": user_id,
            "connected_at": datetime.utcnow(),
        }

        logger.info(f"WebSocket connected for user {user_id}. Total connections: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        """
        Remove a WebSocket connection

        Args:
            websocket: WebSocket connection object
            user_id: User UUID
        """
        # Remove from active connections
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)

            # Clean up empty sets
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        # Remove metadata
        if id(websocket) in self.connection_metadata:
            del self.connection_metadata[id(websocket)]

        logger.info(f"WebSocket disconnected for user {user_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        """
        Send a message to all connections of a specific user

        Args:
            message: Dictionary to send as JSON
            user_id: User UUID
        """
        if user_id not in self.active_connections:
            logger.warning(f"No active connections for user {user_id}")
            return

        # Send to all user's connections
        disconnected = set()
        for connection in self.active_connections[user_id]:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                disconnected.add(connection)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                disconnected.add(connection)

        # Clean up disconnected websockets
        for ws in disconnected:
            self.disconnect(ws, user_id)

    async def send_alert(self, alert_data: dict, user_id: str):
        """
        Send an alert to a specific user

        Args:
            alert_data: Alert information
            user_id: User UUID
        """
        message = {
            "type": "alert",
            "timestamp": datetime.utcnow().isoformat(),
            "data": alert_data,
        }

        await self.send_personal_message(message, user_id)

    async def send_notification(self, notification_data: dict, user_id: str):
        """
        Send a notification to a specific user

        Args:
            notification_data: Notification information
            user_id: User UUID
        """
        message = {
            "type": "notification",
            "timestamp": datetime.utcnow().isoformat(),
            "data": notification_data,
        }

        await self.send_personal_message(message, user_id)

    async def broadcast(self, message: dict):
        """
        Broadcast a message to all connected clients

        Args:
            message: Dictionary to send as JSON
        """
        logger.info(f"Broadcasting message to {len(self.active_connections)} users")

        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)

    async def send_heartbeat(self, user_id: str):
        """
        Send a heartbeat message to keep connection alive

        Args:
            user_id: User UUID
        """
        message = {
            "type": "heartbeat",
            "timestamp": datetime.utcnow().isoformat(),
        }

        await self.send_personal_message(message, user_id)

    def get_connected_users(self) -> list:
        """
        Get list of all connected user IDs

        Returns:
            List of user UUIDs
        """
        return list(self.active_connections.keys())

    def get_connection_count(self, user_id: str = None) -> int:
        """
        Get connection count for a user or total

        Args:
            user_id: Optional user UUID

        Returns:
            Number of connections
        """
        if user_id:
            return len(self.active_connections.get(user_id, set()))

        return sum(len(conns) for conns in self.active_connections.values())

    def is_user_connected(self, user_id: str) -> bool:
        """
        Check if a user has any active connections

        Args:
            user_id: User UUID

        Returns:
            True if user is connected
        """
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


# Global connection manager instance
manager = ConnectionManager()
