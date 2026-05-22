from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class ModelEntity:

    id: int
    admin_id: Optional[str]
    model_name: str
    version: str
    file_path: str
    is_active: bool
    created_at: datetime

    @classmethod
    def from_dict(cls, data: dict) -> "ModelEntity":
        return cls(
            id=data["id"],
            admin_id=data.get("admin_id"),
            model_name=data["model_name"],
            version=data["version"],
            file_path=data["file_path"],
            is_active=data.get("is_active", False),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
            if isinstance(data.get("created_at"), str)
            else datetime.now(),
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "model_name": self.model_name,
            "version": self.version,
            "file_path": self.file_path,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }
