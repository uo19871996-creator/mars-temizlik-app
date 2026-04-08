from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.getenv("DB_NAME", "mars_cleaning")]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "mars-cleaning-secret-key-2025")
ALGORITHM = "HS256"
security = HTTPBearer()

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AppointmentCreate(BaseModel):
    service_id: str
    date: str
    time_slot: str
    address: str
    notes: Optional[str] = ""

class AppointmentUpdate(BaseModel):
    status: str

class ReviewCreate(BaseModel):
    appointment_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: str

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Mars Cleaning API"}

@app.post("/api/auth/register")
async def register(user: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_doc = {
        "email": user.email,
        "password_hash": hash_password(user.password),
        "full_name": user.full_name,
        "phone": user.phone,
        "role": "customer",
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user_doc)
    
    # Create token
    token = create_access_token({"user_id": str(result.inserted_id)})
    
    return {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": "customer"
        }
    }

@app.post("/api/auth/login")
async def login(user: UserLogin):
    # Find user
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_access_token({"user_id": str(db_user["_id"])})
    
    return {
        "token": token,
        "user": {
            "id": str(db_user["_id"]),
            "email": db_user["email"],
            "full_name": db_user["full_name"],
            "phone": db_user["phone"],
            "role": db_user["role"]
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "phone": current_user["phone"],
        "role": current_user["role"]
    }

@app.get("/api/services")
async def get_services():
    services = await db.services.find().to_list(100)
    return [{"id": str(s["_id"]), **{k: v for k, v in s.items() if k != "_id"}} for s in services]

@app.post("/api/appointments")
async def create_appointment(appointment: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    # Verify service exists
    service = await db.services.find_one({"_id": ObjectId(appointment.service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    appointment_doc = {
        "user_id": str(current_user["_id"]),
        "service_id": appointment.service_id,
        "service_name": service["name"],
        "service_price": service["price"],
        "date": appointment.date,
        "time_slot": appointment.time_slot,
        "address": appointment.address,
        "notes": appointment.notes,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    result = await db.appointments.insert_one(appointment_doc)
    return {"id": str(result.inserted_id), "message": "Appointment created successfully"}

@app.get("/api/appointments")
async def get_appointments(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == "customer":
        query["user_id"] = str(current_user["_id"])
    
    appointments = await db.appointments.find(query).sort("created_at", -1).to_list(1000)
    
    result = []
    for apt in appointments:
        # Get user info if admin
        user_info = None
        if current_user["role"] == "admin":
            user = await db.users.find_one({"_id": ObjectId(apt["user_id"])})
            if user:
                user_info = {
                    "full_name": user["full_name"],
                    "phone": user["phone"],
                    "email": user["email"]
                }
        
        apt_dict = {
            "id": str(apt["_id"]),
            **{k: v for k, v in apt.items() if k != "_id"}
        }
        if user_info:
            apt_dict["user_info"] = user_info
        result.append(apt_dict)
    
    return result

@app.get("/api/appointments/{appointment_id}")
async def get_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check authorization
    if current_user["role"] == "customer" and appointment["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {"id": str(appointment["_id"]), **{k: v for k, v in appointment.items() if k != "_id"}}

@app.patch("/api/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, update: AppointmentUpdate, current_user: dict = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Only admin or owner can update
    if current_user["role"] != "admin" and appointment["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": update.status, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Appointment updated successfully"}

@app.delete("/api/appointments/{appointment_id}")
async def cancel_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment["user_id"] != str(current_user["_id"]) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Appointment cancelled successfully"}

@app.post("/api/reviews")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    # Check if appointment exists and belongs to user
    appointment = await db.appointments.find_one({"_id": ObjectId(review.appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if appointment["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed appointments")
    
    # Check if review already exists
    existing_review = await db.reviews.find_one({"appointment_id": review.appointment_id})
    if existing_review:
        raise HTTPException(status_code=400, detail="Review already exists for this appointment")
    
    review_doc = {
        "appointment_id": review.appointment_id,
        "user_id": str(current_user["_id"]),
        "user_name": current_user["full_name"],
        "rating": review.rating,
        "comment": review.comment,
        "created_at": datetime.utcnow()
    }
    
    result = await db.reviews.insert_one(review_doc)
    return {"id": str(result.inserted_id), "message": "Review created successfully"}

@app.get("/api/reviews")
async def get_reviews():
    reviews = await db.reviews.find().sort("created_at", -1).limit(50).to_list(50)
    return [{"id": str(r["_id"]), **{k: v for k, v in r.items() if k != "_id"}} for r in reviews]

@app.post("/api/seed")
async def seed_data():
    # Check if services already exist
    existing_services = await db.services.count_documents({})
    if existing_services > 0:
        return {"message": "Data already seeded"}
    
    # Seed services
    services = [
        {
            "name": "Ev Temizliği",
            "description": "Standart ev temizlik hizmeti. Tüm odalar, mutfak ve banyolar dahil.",
            "duration_minutes": 180,
            "price": 500,
            "icon": "home"
        },
        {
            "name": "Ofis Temizliği",
            "description": "Profesyonel ofis temizlik hizmeti. Çalışma alanları, toplantı odaları ve ortak alanlar.",
            "duration_minutes": 240,
            "price": 800,
            "icon": "briefcase"
        },
        {
            "name": "Derin Temizlik",
            "description": "Detaylı derin temizlik hizmeti. Halı, koltuk ve zor ulaşılan alanlar dahil.",
            "duration_minutes": 300,
            "price": 1200,
            "icon": "sparkles"
        },
        {
            "name": "Cam Temizliği",
            "description": "İç ve dış cam temizlik hizmeti. Profesyonel ekipman ile kusursuz sonuç.",
            "duration_minutes": 120,
            "price": 400,
            "icon": "square"
        }
    ]
    
    await db.services.insert_many(services)
    
    # Create admin user
    admin_exists = await db.users.find_one({"role": "admin"})
    if not admin_exists:
        admin_user = {
            "email": "admin@marstemizlik.com",
            "password_hash": hash_password("admin123"),
            "full_name": "Mars Temizlik Admin",
            "phone": "+905551234567",
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
    
    return {"message": "Data seeded successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)