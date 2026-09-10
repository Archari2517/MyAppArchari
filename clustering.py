"""
clustering.py
--------------
ดึงข้อมูลจักรยานจาก API ของตัวเอง (server.js -> GET /api/Inventory)
แล้วจัดกลุ่มสินค้าตามราคา (price) ด้วย K-Means Clustering

วิธีรัน:
    1. ติดตั้ง dependencies:  pip install -r requirements.txt
    2. เปิด server.js ให้รันอยู่ก่อน (node server.js)
    3. รันไฟล์นี้:              python clustering.py
"""

import io
import base64
import requests
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# ตั้งค่าฟอนต์ให้รองรับภาษาไทยในกราฟ (Tahoma มีอยู่ใน Windows ทุกเครื่อง)
try:
    plt.rcParams["font.family"] = "Tahoma"
except Exception:
    pass
plt.rcParams["axes.unicode_minus"] = False

# ============================
# 1) ตั้งค่า API endpoint ของตัวเอง
# ============================
# เปลี่ยน host/port ให้ตรงกับเครื่องที่รัน server.js จริง
API_URL = "http://119.59.102.161:3068/api/Inventory"

# ============================
# 2) ดึงข้อมูลจาก API
# ============================
res = requests.get(API_URL, timeout=10)
res.raise_for_status()
data = res.json()

df = pd.DataFrame(data)

if df.empty:
    raise SystemExit(
        "ไม่มีข้อมูลสินค้าใน database เลย กรุณาเพิ่มข้อมูลจักรยานก่อนรัน clustering"
    )

print(f"ดึงข้อมูลมาได้ทั้งหมด {len(df)} รายการ")
print(df[["id", "bike_name", "brand", "price"]])

# ============================
# 3) เตรียมข้อมูล (Data Preparation)
# ============================
# ใช้ราคา (price) เป็น feature หลักในการจัดกลุ่ม
features = df[["price"]]

# Standardize ข้อมูลก่อนเข้า K-Means (สำคัญมาก เพื่อให้ scale เท่ากัน)
scaled = StandardScaler().fit_transform(features)

# ============================
# 4) รัน K-Means Clustering
# ============================
# n_clusters=3 หมายถึงแบ่งสินค้าออกเป็น 3 กลุ่ม เช่น ถูก / กลาง / แพง
# ถ้าไม่แน่ใจว่ากี่กลุ่มดี ให้รัน elbow_method.py ก่อน (ดูไฟล์แยก)
N_CLUSTERS = 3

kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init=10)
df["cluster"] = kmeans.fit_predict(scaled)

# ============================
# 5) แสดงผลลัพธ์
# ============================
print("\n=== ผลลัพธ์การจัดกลุ่มสินค้าตามราคา ===")
result = df[["id", "bike_name", "brand", "price", "cluster"]].sort_values(
    ["cluster", "price"]
)
print(result.to_string(index=False))

# สรุปช่วงราคาของแต่ละ cluster เพื่อช่วยตั้งชื่อกลุ่ม (budget/mid-range/premium)
print("\n=== สรุปช่วงราคาแต่ละ Cluster ===")
summary = df.groupby("cluster")["price"].agg(["min", "max", "mean", "count"])
print(summary)

# บันทึกผลลัพธ์เป็นไฟล์ CSV เก็บไว้ดู/แนบในรายงานได้
result.to_csv("cluster_results.csv", index=False, encoding="utf-8-sig")
print("\nบันทึกผลลัพธ์ลงไฟล์ cluster_results.csv เรียบร้อยแล้ว")

# ============================
# 6) ทำกราฟแสดงผล Cluster
# ============================
# ตั้งชื่อกลุ่มอัตโนมัติตามค่าเฉลี่ยราคา (ถูก -> แพง)
price_rank = summary["mean"].sort_values().index.tolist()
label_names = ["Budget (ประหยัด)", "Mid-range (กลาง)", "Premium (พรีเมียม)"]
cluster_label = {
    cluster_id: (
        label_names[i] if i < len(label_names) else f"Cluster {cluster_id}"
    )
    for i, cluster_id in enumerate(price_rank)
}
df["cluster_name"] = df["cluster"].map(cluster_label)

colors = ["#4C72B0", "#DD8452", "#55A868", "#C44E52", "#8172B2"]

plt.figure(figsize=(9, 6))
for i, cluster_id in enumerate(price_rank):
    subset = df[df["cluster"] == cluster_id]
    plt.scatter(
        subset["price"],
        subset["stock_qty"],
        s=100,
        color=colors[i % len(colors)],
        label=f"Cluster {cluster_id} ({cluster_label[cluster_id]})",
        edgecolors="white",
        linewidths=0.8,
    )
    # ใส่ชื่อรุ่นกำกับแต่ละจุด
    for _, row in subset.iterrows():
        plt.annotate(
            row["bike_name"],
            (row["price"], row["stock_qty"]),
            fontsize=8,
            xytext=(5, 5),
            textcoords="offset points",
        )

plt.xlabel("ราคา (บาท)")
plt.ylabel("จำนวนคงเหลือ (stock_qty)")
plt.title("K-Means Clustering: จัดกลุ่มจักรยานตามราคา")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("cluster_plot.png", dpi=150)
print("บันทึกกราฟไว้ที่ cluster_plot.png เรียบร้อยแล้ว")

# เก็บกราฟเป็น base64 เพื่อฝังลงในหน้าเว็บรายงานโดยตรง (ไม่ต้องพึ่งไฟล์รูปแยก)
buf = io.BytesIO()
plt.savefig(buf, format="png", dpi=150)
buf.seek(0)
chart_base64 = base64.b64encode(buf.read()).decode("utf-8")
plt.close()

# ============================
# 7) สร้างหน้าเว็บรายงาน (report.html)
# ============================
cluster_colors_map = {
    cluster_id: colors[i % len(colors)] for i, cluster_id in enumerate(price_rank)
}

# การ์ดสรุปแต่ละ cluster
summary_cards_html = ""
for cluster_id in price_rank:
    row = summary.loc[cluster_id]
    summary_cards_html += f"""
    <div class="card" style="border-top: 4px solid {cluster_colors_map[cluster_id]};">
      <h3>{cluster_label[cluster_id]}</h3>
      <p class="count">{int(row['count'])} รายการ</p>
      <p>ราคา {int(row['min']):,} - {int(row['max']):,} บาท</p>
      <p>เฉลี่ย {row['mean']:,.0f} บาท</p>
    </div>"""

# ตารางข้อมูลทั้งหมด
table_rows_html = ""
for _, row in result.merge(
    df[["id", "cluster_name"]], on="id", how="left"
).iterrows():
    color = cluster_colors_map[row["cluster"]]
    table_rows_html += f"""
    <tr>
      <td>{row['id']}</td>
      <td>{row['bike_name']}</td>
      <td>{row['brand']}</td>
      <td class="price">{row['price']:,} บาท</td>
      <td><span class="badge" style="background:{color};">{row['cluster_name']}</span></td>
    </tr>"""

html_content = f"""<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>รายงานการจัดกลุ่มสินค้าด้วย K-Means Clustering</title>
<style>
  body {{
    font-family: 'Segoe UI', Tahoma, sans-serif;
    background: #f4f6f9;
    color: #222;
    margin: 0;
    padding: 40px;
  }}
  h1 {{ text-align: center; color: #1a3c6e; margin-bottom: 4px; }}
  .subtitle {{ text-align: center; color: #666; margin-bottom: 30px; }}
  .container {{ max-width: 1000px; margin: 0 auto; }}
  .cards {{
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 30px;
  }}
  .card {{
    background: white;
    border-radius: 10px;
    padding: 16px 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    min-width: 180px;
    text-align: center;
  }}
  .card h3 {{ margin: 0 0 8px 0; font-size: 16px; }}
  .card .count {{ font-size: 24px; font-weight: bold; margin: 4px 0; }}
  .chart-box {{
    background: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    text-align: center;
    margin-bottom: 30px;
  }}
  .chart-box img {{ max-width: 100%; height: auto; }}
  table {{
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }}
  th, td {{
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }}
  th {{
    background: #1a3c6e;
    color: white;
  }}
  td.price {{ text-align: right; font-weight: 600; }}
  .badge {{
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 13px;
  }}
  footer {{ text-align: center; margin-top: 30px; color: #999; font-size: 13px; }}
</style>
</head>
<body>
  <div class="container">
    <h1>รายงานการจัดกลุ่มสินค้า (K-Means Clustering)</h1>
    <p class="subtitle">จัดกลุ่มจักรยานตามราคา — ทั้งหมด {len(df)} รายการ</p>

    <div class="cards">
      {summary_cards_html}
    </div>

    <div class="chart-box">
      <img src="data:image/png;base64,{chart_base64}" alt="Cluster Chart">
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>ชื่อรุ่น</th>
          <th>แบรนด์</th>
          <th>ราคา</th>
          <th>กลุ่ม</th>
        </tr>
      </thead>
      <tbody>
        {table_rows_html}
      </tbody>
    </table>

    <footer>สร้างโดย clustering.py — K-Means Clustering Report</footer>
  </div>
</body>
</html>"""

with open("report.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("สร้างหน้าเว็บรายงานไว้ที่ report.html เรียบร้อยแล้ว (เปิดไฟล์นี้ด้วยเบราว์เซอร์ได้เลย)")
