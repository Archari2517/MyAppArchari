"""
elbow_method.py
----------------
หาจำนวนกลุ่ม (k) ที่เหมาะสมสำหรับ K-Means ก่อนรัน clustering.py จริง
ใช้หลักการ Elbow Method: ลองรัน K-Means หลายค่า k แล้วดูกราฟ inertia
จุดที่กราฟ "หักศอก" (elbow) คือค่า k ที่เหมาะสม

วิธีรัน:
    python elbow_method.py
"""

import requests
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

API_URL = "http://119.59.102.161:3068/api/Inventory"

res = requests.get(API_URL, timeout=10)
res.raise_for_status()
df = pd.DataFrame(res.json())

if df.empty:
    raise SystemExit("ไม่มีข้อมูลสินค้าใน database เลย กรุณาเพิ่มข้อมูลก่อน")

features = df[["price"]]
scaled = StandardScaler().fit_transform(features)

# ลองค่า k ตั้งแต่ 1 ถึง จำนวนข้อมูล-1 (หรือสูงสุด 9)
max_k = min(9, len(df) - 1) if len(df) > 1 else 1

inertias = []
k_range = range(1, max_k + 1)
for k in k_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(scaled)
    inertias.append(km.inertia_)

plt.plot(list(k_range), inertias, marker="o")
plt.xlabel("Number of clusters (k)")
plt.ylabel("Inertia")
plt.title("Elbow Method - หาค่า k ที่เหมาะสม")
plt.grid(True)
plt.savefig("elbow_plot.png")
print("บันทึกกราฟไว้ที่ elbow_plot.png แล้ว ดูจุดที่กราฟหักศอกเพื่อเลือกค่า k")
plt.show()
