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
  responses: Array.isArray(data.responses) ? data.responses : [],
  users: Array.isArray(data.users) ? data.users : []
};
  } catch (error) {
    console.error("Error leyendo data.json:", error);
    return { responses: [] };
  }
};


const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};


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

// REGISTRO DE USUARIO
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  const data = readData();

  // Verificar si el usuario ya existe
  if (data.users.find(u => u.username === username)) {
    return res.status(400).json({ error: "El usuario ya existe" });
  }

  const newUser = {
    username,
    password, // Nota: En un entorno real, esto debería estar encriptado
    avatar: username[0].toUpperCase(),
    joinDate: new Date().toLocaleDateString()
  };

  data.users.push(newUser);
  writeData(data);
  res.json(newUser);
});

// INICIO DE SESIÓN
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const data = readData();

  // 1. Primero buscamos SOLO por el nombre de usuario
  const user = data.users.find(u => u.username === username);
  
  // 2. Si no encontramos al usuario, devolvemos error
  if (!user) {
    return res.status(400).json({ error: "El usuario no existe" });
  }

  // 3. Si el usuario existe, verificamos si la contraseña COINCIDE
  if (user.password !== password) {
    return res.status(400).json({ error: "Contraseña incorrecta" });
  }

  // 4. Si llegamos aquí, usuario y contraseña son correctos
  res.json(user);
});

app.get("/", (req, res) => {
  res.send("Backend RealTalk funcionando");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend activo en puerto", PORT);
});


