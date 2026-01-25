const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const fs = require("fs");
const path = require("path");
const User = require("./models/User");
require("dotenv").config();



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conexión exitosa a MongoDB Atlas"))
  .catch(err => console.error("❌ Error de conexión:", err));

// Definimos cómo se guardarán las respuestas en la base de datos
const Response = require("./models/Response");




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
    res.json(savedResponse);
  } catch (err) {
    console.error("❌ ERROR AL GUARDAR:", err.message);
    res.status(500).send(err.message); 
  }
});


app.delete("/api/admin/responses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminKey = req.headers.adminkey;

    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: "No autorizado" });
    }

    await Response.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al borrar" });
  }
});





// Ruta para actualizar votos usando el _id de MongoDB
app.post("/api/responses/:resId/vote", async (req, res) => {
  const { resId } = req.params;
  const { type, action } = req.body;
  const increment = action === 'add' ? 1 : -1;

  try {
    const updated = await Response.findByIdAndUpdate(
      resId,
      { $inc: { [type]: increment } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "No se encontró el mensaje" });
    res.json({ ok: true, newCount: updated[type] });
  } catch (err) {
    console.error("Error al votar:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});








// Ruta para añadir comentarios al array de un mensaje
app.post("/api/responses/:resId/comments", async (req, res) => {
  const { resId } = req.params;
  const { user, content } = req.body;

  try {
    const updated = await Response.findByIdAndUpdate(
      resId,
      { $push: { comments: { user, content, createdAt: new Date() } } },
      { new: true }
    );
    res.json({ ok: true, comments: updated.comments });
  } catch (err) {
    console.error("Error al comentar:", err);
    res.status(500).json({ error: "No se pudo comentar" });
  }
});








// REGISTRO DE USUARIO

app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Usuario ya existe" });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    res.json({ ok: true, username });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});



// INICIO DE SESIÓN
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Usuario no existe" });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    res.json({ ok: true, username });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});



app.get("/", (req, res) => {
  res.send("Backend RealTalk funcionando");
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend activo en puerto", PORT);
});


