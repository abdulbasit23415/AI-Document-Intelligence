import hashlib
import os
import re
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO, Tuple
from apps.api.core.config import settings

def sanitize_filename(filename: str) -> str:
    # Remove path traversal and unsafe characters
    base = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', base)
    return clean[:120] if clean else "document.dat"

class StorageInterface(ABC):
    @abstractmethod
    def save_file(self, workspace_id: str, file_obj: BinaryIO, original_filename: str) -> Tuple[str, str, int]:
        """Returns (storage_path, file_hash, file_size_bytes)"""
        pass

    @abstractmethod
    def get_file_path(self, storage_path: str) -> Path:
        pass

    @abstractmethod
    def delete_file(self, storage_path: str) -> bool:
        pass

class LocalStorageService(StorageInterface):
    def __init__(self, root_dir: Path = settings.STORAGE_DIR):
        self.root_dir = root_dir
        self.root_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, workspace_id: str, file_obj: BinaryIO, original_filename: str) -> Tuple[str, str, int]:
        safe_name = sanitize_filename(original_filename)
        sha256 = hashlib.sha256()
        size = 0
        
        # Read content to memory or temp to calculate hash and size
        file_obj.seek(0)
        content = file_obj.read()
        sha256.update(content)
        file_hash = sha256.hexdigest()
        size = len(content)

        # Store in workspace folder
        target_dir = self.root_dir / workspace_id / file_hash[:8]
        target_dir.mkdir(parents=True, exist_ok=True)
        file_path = target_dir / safe_name

        with open(file_path, "wb") as f:
            f.write(content)

        relative_path = file_path.relative_to(self.root_dir).as_posix()
        return relative_path, file_hash, size

    def get_file_path(self, storage_path: str) -> Path:
        resolved = (self.root_dir / storage_path).resolve()
        # Security check: ensure path is within root_dir
        if not str(resolved).startswith(str(self.root_dir.resolve())):
            raise ValueError("Path traversal attempt detected")
        return resolved

    def delete_file(self, storage_path: str) -> bool:
        try:
            full_path = self.get_file_path(storage_path)
            if full_path.exists():
                full_path.unlink()
                # Remove empty parent directory if empty
                if full_path.parent != self.root_dir and not any(full_path.parent.iterdir()):
                    shutil.rmtree(full_path.parent, ignore_errors=True)
                return True
        except Exception:
            return False
        return False

storage_service = LocalStorageService()
