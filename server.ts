import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to send results
  app.post("/api/send-results", async (req, res) => {
    const { userInfo, score, total, results } = req.body;

    if (!userInfo || !userInfo.name || !userInfo.department) {
      return res.status(400).json({ error: "Missing user information" });
    }

    try {
      // Setup email transporter
      // For real usage, users should set EMAIL_USER and EMAIL_PASS in environment secrets
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const resultDetails = results.map((r: any, idx: number) => 
        `ข้อ ${idx + 1}: ${r.isCorrect ? 'ถูกต้อง ✅' : 'ผิด ❌'} (ตอบ: ${r.userAnswer}, เฉลย: ${r.correctAnswer})`
      ).join('\n');

      const mailOptions = {
        from: `"Safety Quiz Bot" <${process.env.EMAIL_USER}>`,
        to: 'oibomin@gmail.com',
        subject: `ผลการทดสอบความปลอดภัย: ${userInfo.name} (${userInfo.department})`,
        text: `
ชื่อ-นามสกุล: ${userInfo.name}
แผนก: ${userInfo.department}
คะแนนที่ได้: ${score}/${total}
ร้อยละ: ${((score / total) * 100).toFixed(2)}%

รายละเอียด:
${resultDetails}
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Email sending error:", error);
      let errorMessage = "Failed to send email.";
      
      if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
        errorMessage = "Email Authentication Failed: Please check your EMAIL_USER and ensure EMAIL_PASS is a valid 'App Password' from Google.";
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
