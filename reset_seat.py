# reset_seats.py
from models import db, app, MovieSeat, Ticket

with app.app_context():
    # 重設所有座位狀態
    for seat in MovieSeat.query.all():
        seat.status = "available"

    # 清除票券紀錄（選用）
    Ticket.query.delete()

    db.session.commit()
    print("✅ 所有座位已重設為 available，票券清除完成")
