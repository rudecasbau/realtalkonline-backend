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






app.post("/api/responses", async (req, res) => {
  console.log("--- ¡Ha llegado una petición! ---");
  console.log("Datos recibidos del frontend:", req.body);

  try {
    const newResponse = new Response(req.body);
    const savedResponse = await newResponse.save();
    console.log("✅ Guardado con éxito en MongoDB:", savedResponse);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ ERROR AL GUARDAR:", err.message);
    res.status(500).send(err.message); 
  }
});




// Ruta para actualizar votos usando el _id de MongoDB
app.post("/api/responses/:id/vote", async (req, res) => {
  const { id } = req.params; // Este será el _id de MongoDB
  const { type, action } = req.body; // type: 'likes' o 'deepens', action: 'add' o 'remove'
  const increment = action === 'add' ? 1 : -1;

  try {
    // findByIdAndUpdate busca directamente por el _id único
    const updated = await Response.findByIdAndUpdate(
      id,
      { $inc: { [type]: increment } }, // $inc suma o resta automáticamente
      { new: true } // Para que nos devuelva el documento ya actualizado
    );
    
    if (!updated) return res.status(404).json({ error: "No se encontró el mensaje" });
    
    res.json({ ok: true, newCount: updated[type] });
  } catch (err) {
    console.error("Error al votar:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});







// Ruta para añadir comentarios al array de un mensaje
app.post("/api/responses/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { user, content } = req.body;

  try {
    const updated = await Response.findByIdAndUpdate(
      id,
      { 
        $push: { 
          comments: { user, content, createdAt: new Date() } 
        } 
      },
      { new: true }
    );
    res.json({ ok: true, comments: updated.comments });
  } catch (err) {
    res.status(500).json({ error: "No se pudo comentar" });
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


