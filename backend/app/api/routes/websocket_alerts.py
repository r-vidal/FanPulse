"""WebSocket Routes for Real-time Alerts"""
import logging
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.websocket.connection_manager import manager
from app.services.opportunity_detector import get_opportunity_detector

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_current_user_ws(
    websocket: WebSocket,
    token: str = Query(..., description="JWT token for authentication"),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Get current user from WebSocket query parameter

    Args:
        websocket: WebSocket connection
        token: JWT token
        db: Database session

    Returns:
        User if authenticated, None otherwise
    """
    try:
        payload = decode_token(token)
        if payload is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return None

        email = payload.get("sub")
        if email is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token payload")
            return None

        user = db.query(User).filter(User.email == email).first()
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
            return None

        return user

    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Authentication error")
        return None


@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT token"),
    db: Session = Depends(get_db),
):
    """
    WebSocket endpoint for real-time opportunity alerts

    Clients connect with JWT token and receive real-time notifications
    about opportunities, milestones, and important moments.

    **Connection URL:**
    ```
    ws://localhost:8000/api/ws/alerts?token=YOUR_JWT_TOKEN
    ```

    **Message Types Received:**
    - `alert` - Opportunity alert
    - `notification` - General notification
    - `heartbeat` - Connection keepalive
    - `initial_opportunities` - Opportunities on connection

    **Example Client (JavaScript):**
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/api/ws/alerts?token=YOUR_TOKEN');

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data.type, data);

        if (data.type === 'alert') {
            // Show alert notification
            showNotification(data.data.title, data.data.message);
        }
    };

    ws.onopen = () => {
        console.log('Connected to alerts');
    };

    ws.onclose = () => {
        console.log('Disconnected from alerts');
    };
    ```
    """
    # Authenticate user
    user = await get_current_user_ws(websocket, token, db)
    if user is None:
        return

    user_id = str(user.id)

    # Connect to manager
    await manager.connect(websocket, user_id)

    try:
        # Send initial message
        await websocket.send_json({
            "type": "connected",
            "message": "Successfully connected to real-time alerts",
            "user_id": user_id,
        })

        # Send current opportunities
        detector = get_opportunity_detector(db)
        opportunities = detector.detect_all_opportunities(user_id)

        if opportunities:
            await websocket.send_json({
                "type": "initial_opportunities",
                "count": len(opportunities),
                "opportunities": opportunities,
            })

        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()

                # Parse message
                try:
                    message = json.loads(data)
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON format",
                    })
                    continue

                # Handle different message types
                msg_type = message.get("type")

                if msg_type == "ping":
                    # Respond to ping with pong
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": message.get("timestamp"),
                    })

                elif msg_type == "refresh_opportunities":
                    # Re-scan for opportunities
                    opportunities = detector.detect_all_opportunities(user_id)
                    await websocket.send_json({
                        "type": "opportunities_refreshed",
                        "count": len(opportunities),
                        "opportunities": opportunities,
                    })

                elif msg_type == "subscribe":
                    # Client wants to subscribe to specific alert types
                    alert_types = message.get("alert_types", [])
                    await websocket.send_json({
                        "type": "subscribed",
                        "alert_types": alert_types,
                        "message": f"Subscribed to {len(alert_types)} alert types",
                    })

                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {msg_type}",
                    })

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for user {user_id}")
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": "Internal error processing message",
                })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        # Clean up connection
        manager.disconnect(websocket, user_id)


@router.get("/ws/stats")
async def get_websocket_stats():
    """
    Get WebSocket connection statistics

    Returns current connection counts and connected users.
    """
    return {
        "total_connections": manager.get_connection_count(),
        "connected_users": len(manager.get_connected_users()),
        "users": manager.get_connected_users(),
    }
