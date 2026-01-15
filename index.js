const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");


const app = express();


app.use(cors());
app.use(express.json());

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});



const DATA_FILE = path.join(__dirname, 'data.json');

// Función mejorada: si el archivo no existe, lo crea vacío en lugar de fallar
const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initialData = { users: [], responses: [] };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error("Error leyendo data.json:", error);
    return { users: [], responses: [] };
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error escribiendo en data.json:", error);
  }
};



// Obtener respuestas filtradas por ID de pregunta (Actualizado para leer siempre del archivo)
app.get("/api/responses/:qId", (req, res) => {
  const data = readData(); // Esto asegura que cargue los likes y comentarios guardados
  const responses = data.responses.filter(r => r.qId === req.params.qId);
  res.json(responses);
});


// Guardar nueva respuesta
app.post("/api/responses", (req, res) => {
  const data = readData();
  data.responses.unshift(req.body);
  writeData(data);
  res.json({ ok: true });
});

// Guardar VOTO (Likes/Deepens) con lógica de quitar/poner
 app.post("/api/responses/:id/vote", (req, res) => {
  const { id } = req.params;
  const { type, action } = req.body; // action puede ser 'add' o 'remove'
  const data = readData();

  const response = data.responses.find(r => r.id == id || r._id == id);

  if (response) {
  // Aseguramos que no sea negativo
  const currentVal = response[type] || 0;
  
  if (action === 'remove') {
  response[type] = Math.max(0, currentVal - 1);
  } else {
  response[type] = currentVal + 1;
  }
  
  writeData(data);
  res.json({ ok: true, newCount: response[type] });
  } else {
  res.status(404).json({ error: "Respuesta no encontrada" });
  }
 });



 // Guardar COMENTARIO
 app.post("/api/responses/:id/comment", (req, res) => {
  const { id } = req.params;
  const newComment = req.body;
  const data = readData();

  const response = data.responses.find(r => r.id == id || r._id == id);

  if (response) {
  if (!response.comments) response.comments = [];
  response.comments.push(newComment);
  writeData(data);
  res.json({ ok: true });
  } else {
  res.status(404).json({ error: "Respuesta no encontrada" });
  }
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

  // 1. Buscamos al usuario por nombre
  const user = data.users.find(u => u.username === username);

  // 2. Si no existe el usuario
  if (!user) {
    return res.status(400).json({ error: "El usuario no existe" });
  }

  // 3. Si el usuario existe, comprobamos la contraseña
  if (user.password !== password) {
    return res.status(400).json({ error: "Contraseña incorrecta" }); // <--- Aquí está el mensaje que querías
  }

  // 4. Todo correcto
  res.json(user);
});

app.get("/", (req, res) => {
  res.send("Backend RealTalk funcionando");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend activo en puerto", PORT);
});


