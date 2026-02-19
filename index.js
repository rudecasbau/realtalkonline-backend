const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Response = require("./models/Response");

const app = express();


// =======================
// CONEXIÓN A MONGODB
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conexión exitosa a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error de conexión:", err));


// =======================
// MIDDLEWARES
// =======================
app.use(cors());
app.use(express.json());


// =======================
// RUTAS BÁSICAS
// =======================
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.send("Backend RealTalk funcionando");
});


// =======================
// RESPUESTAS
// =======================

// Obtener respuestas por ID de pregunta
app.get("/api/responses/:qId", async (req, res) => {
  try {
    const responses = await Response.find({ qId: req.params.qId })
      .sort({ createdAt: -1 });

    res.json(responses);
  } catch (err) {
    console.error("Error al leer de MongoDB:", err);
    res.status(500).json({ error: "No se pudieron cargar los datos" });
  }
});

// Crear nueva respuesta
app.post("/api/responses", async (req, res) => {
  try {
    const newResponse = new Response(req.body);
    const savedResponse = await newResponse.save();
    res.json(savedResponse);
  } catch (err) {
    console.error("❌ ERROR AL GUARDAR:", err.message);
    res.status(500).json({ error: "Error al guardar" });
  }
});

// Borrar respuesta (admin)
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

// Votar respuesta
app.post("/api/responses/:resId/vote", async (req, res) => {
  const { resId } = req.params;
  const { type, action } = req.body;
  const increment = action === "add" ? 1 : -1;

  try {
    const updated = await Response.findByIdAndUpdate(
      resId,
      { $inc: { [type]: increment } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "No se encontró el mensaje" });
    }

    res.json({ ok: true, newCount: updated[type] });
  } catch (err) {
    console.error("Error al votar:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Añadir comentario
app.post("/api/responses/:resId/comments", async (req, res) => {
  const { resId } = req.params;
  const { user, content } = req.body;

  if (!user || !content) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const updated = await Response.findByIdAndUpdate(
      resId,
      {
        $push: {
          comments: {
            user,
            content,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Respuesta no encontrada" });
    }

    res.json({ ok: true, comments: updated.comments });
  } catch (err) {
    console.error("Error al guardar comentario:", err);
    res.status(500).json({ error: "No se pudo guardar comentario" });
  }
});


// =======================
// AUTENTICACIÓN
// =======================

// Registro
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

    const newUser = new User({
      username,
      password,
      avatar: "🙂" // avatar por defecto
    });

    await newUser.save();

    res.json({
      ok: true,
      username: newUser.username,
      avatar: newUser.avatar
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Login
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

    res.json({
      ok: true,
      username: user.username,
      avatar: user.avatar
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar avatar
app.put("/api/users/:username/avatar", async (req, res) => {
  const { username } = req.params;
  const { avatar } = req.body;

  if (!avatar) {
    return res.status(400).json({ error: "Falta el avatar" });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { username },
      { avatar },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      ok: true,
      avatar: updatedUser.avatar
    });

  } catch (err) {
    console.error("Error actualizando avatar:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});


// =======================
// SERVIDOR
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Backend activo en puerto", PORT);
});


