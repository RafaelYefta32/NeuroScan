
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class ClassificationResult:

    id: Optional[int]
    user_id: str
    model_id: Optional[int]
    image_mri: str
    predicted_class: str
    confidence_score: float
    explanation: Optional[str]
    created_at: datetime

    @classmethod
    def from_dict(cls, data: dict) -> "ClassificationResult":
        return cls(
            id=data.get("id"),
            user_id=data["user_id"],
            model_id=data.get("model_id"),
            image_mri=data.get("image_mri", ""),
            predicted_class=data["predicted_class"],
            confidence_score=float(data["confidence_score"]),
            explanation=data.get("explanation"),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
            if isinstance(data.get("created_at"), str)
            else datetime.now(),
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "model_id": self.model_id,
            "image_mri": self.image_mri,
            "predicted_class": self.predicted_class,
            "confidence_score": self.confidence_score,
            "explanation": self.explanation,
            "created_at": self.created_at.isoformat(),
        }

    def confidence_percentage(self) -> float:
        return round(self.confidence_score * 100, 2)

    def is_tumor_detected(self) -> bool:
        return self.predicted_class.lower() != "notumor"
