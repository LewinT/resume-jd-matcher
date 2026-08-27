import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_PAGES = 50;
const MAX_IMAGE_SIZE = 16_777_216;
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function hasPdfSignature(data: Uint8Array) {
  const bytesToCheck = Math.min(data.length, 1024);

  for (let index = 0; index <= bytesToCheck - PDF_SIGNATURE.length; index++) {
    const matches = PDF_SIGNATURE.every(
      (byte, signatureIndex) => data[index + signatureIndex] === byte,
    );

    if (matches) {
      return true;
    }
  }

  return false;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.startsWith("multipart/form-data")) {
    return errorResponse("Please send the resume as multipart form data.", 415);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("The uploaded form data could not be read.", 400);
  }

  const uploadedFile = formData.get("file");

  if (!(uploadedFile instanceof File)) {
    return errorResponse('Please provide a PDF in the "file" field.', 400);
  }

  if (uploadedFile.size > MAX_FILE_SIZE) {
    return errorResponse("The PDF must be 4 MB or smaller.", 413);
  }

  if (uploadedFile.size === 0) {
    return errorResponse("The uploaded PDF is empty.", 400);
  }

  const hasPdfType = uploadedFile.type.toLowerCase() === "application/pdf";
  const hasPdfExtension = uploadedFile.name.toLowerCase().endsWith(".pdf");

  if (!hasPdfType && !hasPdfExtension) {
    return errorResponse("Please upload a PDF file.", 400);
  }

  const data = new Uint8Array(await uploadedFile.arrayBuffer());

  if (!hasPdfSignature(data)) {
    return errorResponse("The uploaded file is not a valid PDF.", 400);
  }

  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | null = null;

  try {
    pdf = await getDocumentProxy(data, { maxImageSize: MAX_IMAGE_SIZE });

    if (pdf.numPages > MAX_PAGES) {
      return errorResponse(`The PDF cannot contain more than ${MAX_PAGES} pages.`, 400);
    }

    const result = await extractText(pdf, { mergePages: true });
    const text = result.text.trim();
    const meaningfulCharacters = text.replace(/\s/g, "");

    if (meaningfulCharacters.length < 20) {
      return errorResponse(
        "No extractable text was found. Please use a text-based PDF; scanned PDFs are not supported.",
        422,
      );
    }

    return Response.json({ text, pages: result.totalPages });
  } catch {
    return errorResponse(
      "The PDF could not be read. It may be damaged, password-protected, or unsupported.",
      422,
    );
  } finally {
    if (pdf) {
      try {
        await pdf.cleanup();
      } catch {
        // Cleanup errors should not replace the response already prepared above.
      }
    }
  }
}
