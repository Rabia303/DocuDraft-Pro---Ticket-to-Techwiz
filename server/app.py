from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
import os, bcrypt, jwt, random, smtplib
from email.mime.text import MIMEText
import google.generativeai as genai
from bson import ObjectId

# Load env
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB Atlas config
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
mongo = PyMongo(app)

# JWT secret
JWT_SECRET = os.getenv("JWT_SECRET", "secret")

# Gemini API config
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ---------------- EMAIL UTILS ----------------
def send_email(to_email, subject, body):
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = os.getenv("EMAIL_USER")
        sender_pass = os.getenv("EMAIL_PASS")

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = to_email

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_pass)
        server.sendmail(sender_email, [to_email], msg.as_string())
        server.quit()
    except Exception as e:
        print("Email sending failed:", e)

# ---------------- AUTH ROUTES ----------------
@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    email, password = data.get("email"), data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = mongo.db.users.find_one({"email": email})
    if user:
        return jsonify({"error": "User already exists"}), 400

    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    otp = str(random.randint(100000, 999999))
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=5)  # ✅ fixed

    mongo.db.users.insert_one({
        "email": email,
        "password": hashed_pw,
        "is_verified": False,
        "otp": otp,
        "otp_expiry": otp_expiry
    })

    send_email(email, "Verify Your Email", f"Your OTP is {otp}")
    return jsonify({"message": "OTP sent to email"}), 201

@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    email, otp = data.get("email"), data.get("otp")

    user = mongo.db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    expiry = user.get("otp_expiry")
    if expiry:
        # make sure it's timezone-aware
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
    else:
        return jsonify({"error": "OTP not found"}), 400

    if user["otp"] != otp or datetime.now(timezone.utc) > expiry:
        return jsonify({"error": "Invalid or expired OTP"}), 400

    mongo.db.users.update_one({"email": email}, {
        "$set": {"is_verified": True},
        "$unset": {"otp": "", "otp_expiry": ""}
    })

    return jsonify({"message": "Email verified successfully"})



@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email, password = data.get("email"), data.get("password")

    user = mongo.db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.get("is_verified"):
        return jsonify({"error": "Email not verified"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    # ✅ timezone-aware JWT expiry
    token = jwt.encode(
        {"id": str(user["_id"]), "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        JWT_SECRET,
        algorithm="HS256"
    )
    return jsonify({"token": token})


# ---------------- GEMINI CHAT ROUTE ----------------
system_prompt = """
You are DocuDraft Pro Assistant...
"""

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        message = data.get("message")

        if not message:
            return jsonify({"error": "Message is required"}), 400

        model = genai.GenerativeModel("gemini-1.5-flash")
        full_prompt = f"{system_prompt}\n\nUser: {message}\n\nAssistant:"
        response = model.generate_content(full_prompt)

        return jsonify({"reply": response.text})
    except Exception as e:
        print("Error calling Gemini API:", e)
        return jsonify({"error": "Failed to get response from AI"}), 500

# ---------------- SAVE & SHARE CHAT ----------------
@app.route("/api/save-chat", methods=["POST"])
def save_chat():
    try:
        data = request.json
        messages = data.get("messages")

        if not messages:
            return jsonify({"error": "No messages to save"}), 400

        # Save to MongoDB
        chat = {
            "messages": messages,
            "created_at": datetime.now(timezone.utc)
        }
        result = mongo.db.chats.insert_one(chat)

        # Generate shareable link
        chat_id = str(result.inserted_id)
        share_link = f"http://localhost:5000/api/share/{chat_id}"

        return jsonify({"link": share_link})
    except Exception as e:
        print("Error saving chat:", e)
        return jsonify({"error": "Failed to save chat"}), 500


@app.route("/api/share/<chat_id>", methods=["GET"])
def share_chat(chat_id):
    try:
        chat = mongo.db.chats.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            return jsonify({"error": "Chat not found"}), 404

        # Convert ObjectId to string for JSON response
        chat["_id"] = str(chat["_id"])
        return jsonify({"chat": chat})
    except Exception as e:
        print("Error fetching chat:", e)
        return jsonify({"error": "Invalid chat link"}), 400
      
# ---------------- PDF UPLOAD & Q&A ----------------
def extract_text_from_pdf(file_path):
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text


@app.route("/api/upload-pdf", methods=["POST"])
def upload_pdf():
    global pdf_text
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF files allowed"}), 400

    # Save and extract text
    os.makedirs("uploads", exist_ok=True)
    file_path = os.path.join("uploads", file.filename)
    file.save(file_path)

    pdf_text = extract_text_from_pdf(file_path)

    return jsonify({"message": "PDF uploaded and processed"}), 200


@app.route("/api/ask", methods=["POST"])
def ask_question():
    global pdf_text
    data = request.json
    question = data.get("question")

    if not pdf_text:
        return jsonify({"error": "No PDF uploaded yet"}), 400

    # Combine question with PDF text
    prompt = f"""
    You are a helpful assistant. Answer the question using only the following PDF content.

    PDF Content:
    {pdf_text[:15000]}  # truncate to avoid long context

    Question: {question}
    """

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    return jsonify({"answer": response.text})



if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
