from flask_sqlalchemy import SQLAlchemy
from flask import Flask

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(app)

# 使用者資料表
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.LargeBinary, nullable=False)     # 登入密碼 hash
    tx_password_hash = db.Column(db.LargeBinary, nullable=False)  # 交易密碼 hash
    public_key = db.Column(db.Text, nullable=False)               # RSA 公開金鑰
    balance = db.Column(db.Integer, nullable=False, default=10000)    # 儲值金
    tickets = db.relationship('Ticket', backref='user', lazy=True)

# 電影與座位資料表
class MovieSeat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie = db.Column(db.String(100), nullable=False)
    showtime = db.Column(db.String(50), nullable=False)  # 放映時間（可調整格式）
    seat_code = db.Column(db.String(10), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='available')  # available / sold
    __table_args__ = (db.UniqueConstraint('movie', 'showtime', 'seat_code', name='_movie_showtime_seat_uc'),)

# 購票記錄 / 票券資料表
class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)  # 唯一票券代碼
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    movie = db.Column(db.String(100), nullable=False)
    seat = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='valid')  # valid / used / canceled
    qr_code = db.Column(db.String(128), unique=True)
