const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");


const mongoose = require('mongoose');

// PEGA AQUÍ TU ENLACE: Recuerda cambiar <db_password> por tu contraseña real
const MONGO_URI = "mongodb+srv://rudecasbau_db:NgTJIarqGa3XucUV@realtalkcluster.rfmnucr.mongodb.net/?appName=RealTalkCluster"; 

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Conexión exitosa a MongoDB Atlas"))
  .catch(err => console.error("❌ Error de conexión:", err));

// Definimos cómo se guardarán las respuestas en la base de datos
const responseSchema = new mongoose.Schema({
  qId: String,
  user: String,
  content: String,
  likes: { type: Number, default: 0 },
  deepens: { type: Number, default: 0 },
  comments: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

const Response = mongoose.model('Response', responseSchema);




const app = express();




app.use(cors());
app.use(express.json());


app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});


// Obtener respuestas de MongoDB
app.get("/api/responses/:qId", async (req, res) => {
  try {
    // Buscamos en la base de datos las respuestas que coincidan con el ID de la pregunta
    const responses = await Response.find({ qId: req.params.qId }).sort({ createdAt: -1 });
    res.json(responses);
  } catch (err) {
    console.error("Error al leer de MongoDB:", err);
    res.status(500).json({ error: "No se pudieron cargar los datos" });
  }
});






// Guardar nueva respuesta en MongoDB
app.post("/api/responses", async (req, res) => {
  try {
    const newResponse = new Response({
      qId: req.body.qId,
      user: req.body.user,
      content: req.body.content,
      // Los likes y comentarios empiezan en 0 por defecto gracias al Schema
    });

    await newResponse.save(); // Esto lo guarda en la nube de MongoDB
    res.json({ ok: true, message: "Guardado en la nube correctamente" });
  } catch (err) {
    console.error("Error al guardar en MongoDB:", err);
    res.status(500).json({ error: "No se pudo guardar el mensaje" });
  }
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


