import json
import mysql.connector
from cryptography.fernet import Fernet


conexion = mysql.connector.connect(
    host="localhost",
    user="root",  
    password="roger",  
    database="ciudad"
)

cursor = conexion.cursor()


with open('city.json', 'r', encoding='utf-8') as file:
    data = json.load(file)
   
    streets = [feature['properties']['name'] for feature in data['features'] if 'name' in feature['properties']]


for street in streets:
    cursor.execute("INSERT INTO calles (nombre) VALUES (%s)", (street,))
    conexion.commit()


cursor.close()
conexion.close()

print(f"Se han insertado {len(streets)} calles en la base de datos.")

key = Fernet.generate_key()
cipher_suite = Fernet(key)

def encrypt(data):
    return cipher_suite.encrypt(data.encode())

def decrypt(encrypted_data):
    return cipher_suite.decrypt(encrypted_data).decode()


calle = "Nombre de la calle"
encrypted_calle = encrypt(calle)

db = mysql.connector.connect(host="localhost", user="root", password="roger", database="ciudad")
cursor = db.cursor()

calle = "Calle segura"
query = "INSERT INTO calles (nombre) VALUES (%s)"
cursor.execute(query, (calle,))
db.commit()