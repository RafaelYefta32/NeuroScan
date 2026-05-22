
import logging
from datetime import datetime

from entities.activity_log import ActivityLog

logger = logging.getLogger(__name__)


class ActivityLogService:

    def __init__(self, supabase_client=None):
        self._supabase = supabase_client

    def record_log(self, user_id: str, activity: str, description: str) -> bool:
        if not self._supabase:
            logger.warning("Supabase tidak tersedia, log tidak dapat disimpan.")
            return False

        try:
            log_entry = ActivityLog(
                id=None,
                user_id=user_id,
                activity=activity,
                description=description,
                created_at=datetime.now(),
            )

            self._supabase.table("activity_logs").insert(
                {
                    "user_id": log_entry.user_id,
                    "activity": log_entry.activity,
                    "description": log_entry.description,
                }
            ).execute()

            logger.info(
                f"Log aktivitas dicatat — user: {user_id}, "
                f"aktivitas: '{activity}'"
            )
            return True

        except Exception as e:
            logger.error(f"Gagal menyimpan log aktivitas: {e}")
            return False
