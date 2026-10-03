from datetime import datetime, timedelta, timezone
from typing import Optional, List
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import User, UserRole


# Security scheme for OpenAPI Swagger documentation
security = HTTPBearer(auto_error=True)


# -------------------------------------------------------------
# Password Hashing & Verification
# -------------------------------------------------------------
def hash_password(password: str) -> str:
    """Hashes a plain-text password using Bcrypt with salt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a Bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# -------------------------------------------------------------
# JWT Token Generation & Verification
# -------------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JSON Web Token (JWT) with expiration."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# -------------------------------------------------------------
# Current User & RBAC Dependencies
# -------------------------------------------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Validates the bearer token, retrieves the authenticated user from the database,
    and ensures the account is active.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: missing subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token: subject identifier is not a valid integer.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user record no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact placement administration.",
        )

    return user


def require_roles(*allowed_roles: UserRole):
    """
    Factory dependency to enforce strict Role-Based Access Control (RBAC).
    Returns a dependency verifying current_user belongs to one of allowed_roles.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            role_names = [r.value for r in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Operation requires one of the following roles: {role_names}. Your role is '{current_user.role.value}'."
            )
        return current_user

    return role_checker


# Role-specific fast dependencies
get_current_student = require_roles(UserRole.STUDENT)
get_current_recruiter = require_roles(UserRole.RECRUITER)
get_current_admin = require_roles(UserRole.ADMIN)
get_recruiter_or_admin = require_roles(UserRole.RECRUITER, UserRole.ADMIN)
get_any_authenticated_user = get_current_user
