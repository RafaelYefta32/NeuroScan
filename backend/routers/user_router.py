import logging
import os
from fastapi import APIRouter, HTTPException
from supabase import create_client, Client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin - User Management"])

def _get_admin_client() -> Client:
    """Membuat Supabase client menggunakan Service Role Key (bypass RLS)."""
    url = os.environ.get("VITE_SUPABASE_URL", "")
    # Service role key memiliki akses penuh tanpa RLS
    service_key = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not service_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Service role key tidak dikonfigurasi di server. "
                "Tambahkan VITE_SUPABASE_SERVICE_ROLE_KEY ke file .env.local "
                "dan restart backend."
            ),
        )
    return create_client(url, service_key)


@router.delete("/users/{user_id}", summary="Hapus akun user (hanya jika belum pernah klasifikasi)")
async def delete_user(user_id: str):
    """
    Menghapus akun user dari Supabase Auth (dan public.users via CASCADE).
    Endpoint ini hanya boleh dipanggil oleh admin dari frontend.
    Validasi klasifikasi dilakukan di sini untuk keamanan ganda.
    """
    try:
        admin_client = _get_admin_client()

        # Verifikasi: pastikan user tidak punya riwayat klasifikasi
        result = admin_client.from_("classification_results") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .execute()

        count = result.count if result.count is not None else 0
        if count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"User memiliki {count} riwayat klasifikasi dan tidak dapat dihapus. Gunakan fitur Disable."
            )

        # Hapus dari auth.users — akan CASCADE ke public.users dan tabel terkait
        delete_result = admin_client.auth.admin.delete_user(user_id)

        logger.info(f"User {user_id} berhasil dihapus oleh admin.")
        return {"success": True, "message": f"User {user_id} berhasil dihapus."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error menghapus user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal menghapus user: {str(e)}")
