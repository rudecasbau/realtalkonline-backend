const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data.json");

const readData = () => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return {
      responses: Array.isArray(data.responses) ? data.responses : []
    };
  } catch (error) {
    console.error("Error leyendo data.json:", error);
    return { responses: [] };
  }
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// --- SISTEMA DE USUARIOS ---
app.post("/api/auth/register", (req, res) => {
  const data = readData();
  const users = data.users || []; // Si no hay lista de usuarios, crea una vacía
  const { username, password } = req.body;

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "¡Ese nombre de usuario ya existe!" });
  }

  const newUser = {
    username,
    password, // Nota: En una app real esto debería ir cifrado
    avatar: username[0].toUpperCase(),
    joinDate: new Date().toLocaleDateString()
  };

  users.push(newUser);
  data.users = users; // Guardamos la lista actualizada
  writeData(data); // Escribimos en el archivo
  
  res.json(newUser);
});

app.post("/api/auth/login", (req, res) => {
  const data = readData();
  const users = data.users || [];
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }
});
// ---------------------------

// Obtener respuestas por pregunta
app.get("/api/responses/:qId", (req, res) => {
  const data = readData();
  const responses = data.responses.filter(
    r => r.qId === req.params.qId
  );
  res.json(responses);
});

// Guardar nueva respuesta
app.post("/api/responses", (req, res) => {
  const data = readData();
  data.responses.unshift(req.body);
  writeData(data);
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.send("Backend RealTalk funcionando");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend activo en puerto", PORT);
});
