from flask_sqlalchemy import SQLAlchemy
from flask import Flask

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.LargeBinary, nullable=False)     # 登入密碼 hash
    tx_password_hash = db.Column(db.LargeBinary, nullable=False)  # 交易密碼 hash
    public_key = db.Column(db.Text, nullable=False)               # RSA 公開金鑰
