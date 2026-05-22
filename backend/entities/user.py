
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class User:
    id: str
    role_id: int
    fullname: str
    email: str
    status: str
    created_at: datetime
    updated_at: datetime
    profession: Optional[str] = None
    institution: Optional[str] = None
    profile_image: Optional[str] = None
    password: str = field(default="[managed by Supabase Auth]", repr=False)

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        return cls(
            id=data["id"],
            role_id=data.get("role_id", 2),
            fullname=data.get("fullname", ""),
            email=data.get("email", ""),
            status=data.get("status", "active"),
            profession=data.get("profession"),
            institution=data.get("institution"),
            profile_image=data.get("profile_image"),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
            if isinstance(data.get("created_at"), str)
            else datetime.now(),
            updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00"))
            if isinstance(data.get("updated_at"), str)
            else datetime.now(),
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "role_id": self.role_id,
            "fullname": self.fullname,
            "email": self.email,
            "status": self.status,
            "profession": self.profession,
            "institution": self.institution,
            "profile_image": self.profile_image,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def is_admin(self) -> bool:
        return self.role_id == 1

    def is_active(self) -> bool:
        return self.status == "active"
