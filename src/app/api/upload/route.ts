import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo supera el límite de 10MB" }, { status: 400 });
    }

    const allowedTypes = [
      "image/png", "image/jpeg", "image/gif", "image/webp",
      "text/plain", "text/csv",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Tipo de archivo no soportado: ${file.type}` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || ".bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filepath, buffer);

    let extractedText = "";

    if (file.type === "text/plain" || file.type === "text/csv") {
      extractedText = buffer.toString("utf-8").slice(0, 50000);
    } else if (file.type === "application/pdf") {
      try {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        extractedText = (result.text ?? "").slice(0, 50000);
      } catch {
        extractedText = "[No se pudo extraer texto del PDF]";
      }
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"
    ) {
      try {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        extractedText = workbook.SheetNames
          .map((name: string) => {
            const sheet = workbook.Sheets[name];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            return `--- Hoja: ${name} ---\n${csv}`;
          })
          .join("\n\n")
          .slice(0, 50000);
      } catch {
        extractedText = "[No se pudo extraer texto del Excel]";
      }
    }

    return NextResponse.json({
      name: file.name,
      url: `/uploads/${filename}`,
      type: file.type,
      size: file.size,
      extractedText,
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
