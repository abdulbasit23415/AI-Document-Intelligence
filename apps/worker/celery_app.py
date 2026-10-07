from celery import Celery
from apps.api.core.config import settings

celery_app = Celery(
    "docmind_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["apps.worker.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 min hard limit per doc
    task_soft_time_limit=240,  # 4 min soft limit
    worker_prefetch_multiplier=1,
)
