from models import db, app, MovieSeat

sample_seats = []

# 定義電影與場次
movies = [
    {"title": "Inception", "price": 250, "times": ["2025-05-30 19:00", "2025-05-31 15:00"]},
    {"title": "Interstellar", "price": 300, "times": ["2025-05-31 20:00", "2025-06-01 18:00"]},
    {"title": "Oppenheimer", "price": 280, "times": ["2025-06-01 21:00", "2025-06-02 17:30"]},
    {"title": "Tenet", "price": 270, "times": ["2025-06-02 20:00", "2025-06-03 14:00"]},
    {"title": "Dunkirk", "price": 260, "times": ["2025-06-03 19:00", "2025-06-04 16:00"]},
    {"title": "The Dark Knight", "price": 290, "times": ["2025-06-04 19:00", "2025-06-05 14:00"]},
    {"title": "Memento", "price": 240, "times": ["2025-06-05 17:00", "2025-06-06 13:30"]},
    {"title": "The Prestige", "price": 265, "times": ["2025-06-06 20:00", "2025-06-07 16:00"]},
    {"title": "Batman Begins", "price": 250, "times": ["2025-06-07 19:30", "2025-06-08 15:00"]},
    {"title": "Following", "price": 230, "times": ["2025-06-08 18:00", "2025-06-09 14:30"]},
]

# 座位排與數量
rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"]  # 16 排
seats_per_row = 16  # 每排 16 個座位

# 建立 sample_seats 陣列
for movie in movies:
    for showtime in movie["times"]:
        for row in rows:
            for num in range(1, seats_per_row + 1):
                seat_code = f"{row}{num}"
                sample_seats.append({
                    "movie": movie["title"],
                    "showtime": showtime,
                    "seat_code": seat_code,
                    "price": movie["price"]
                })

# 寫入資料庫
with app.app_context():
    # 清空舊資料
    db.session.query(MovieSeat).delete()
    db.session.commit()
    print("舊有座位資料已清空")

    # 新增新資料
    for seat in sample_seats:
        s = MovieSeat(**seat)
        db.session.add(s)
    db.session.commit()
    print(f"新增完成，共 {len(sample_seats)} 筆座位資料")
