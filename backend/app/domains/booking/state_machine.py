from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Set

# Centralized status from the model
from .models import Booking, BookingStatus

class ActorRole(str, Enum):
    STUDENT = "STUDENT"
    EXPERT = "EXPERT"
    ADMIN = "ADMIN"

# Phase 2 — BL-06 Explicit state machine
ALLOWED_TRANSITIONS: Dict[BookingStatus, Dict[ActorRole, Set[BookingStatus]]] = {
    BookingStatus.PENDING: {
        ActorRole.EXPERT: {BookingStatus.CONFIRMED, BookingStatus.REJECTED},
        ActorRole.STUDENT: {BookingStatus.CANCELLED},
        ActorRole.ADMIN: {BookingStatus.CANCELLED, BookingStatus.REFUNDED},
    },
    BookingStatus.CONFIRMED: {
        ActorRole.STUDENT: {BookingStatus.COMPLETED, BookingStatus.CANCELLED},
        ActorRole.EXPERT: {BookingStatus.CANCELLED_BY_EXPERT},  # Allowed with penalty (was empty per BL-06)
        ActorRole.ADMIN: {BookingStatus.REFUNDED, BookingStatus.DISPUTED},
    },
    BookingStatus.IN_PROGRESS: {
        ActorRole.STUDENT: {BookingStatus.COMPLETED, BookingStatus.DISPUTED},
        ActorRole.ADMIN: {BookingStatus.REFUNDED},
    },
    # ... other transitions can be added as needed
}

class BookingStateMachine:
    @staticmethod
    def can_transition(current_status: BookingStatus, actor_role: ActorRole, new_status: BookingStatus) -> bool:
        allowed = ALLOWED_TRANSITIONS.get(current_status, {}).get(actor_role, set())
        return new_status in allowed

booking_fsm = BookingStateMachine()
