
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class ActivityLog:

    id: Optional[int]
    user_id: str
    activity: str
    description: str
    created_at: datetime

    @classmethod
    def from_dict(cls, data: dict) -> "ActivityLog":
        return cls(
            id=data.get("id"),
            user_id=data["user_id"],
            activity=data["activity"],
            description=data.get("description", ""),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
            if isinstance(data.get("created_at"), str)
            else datetime.now(),
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "activity": self.activity,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
        }
