import { Router } from "express";
import { z } from "zod";
import { utapi } from "~/uploadthing";
import { authenticateUser } from "~/uploadthing/authenticateUser";

const router = Router();

router.post("/delete", async (req, res) => {
  const user = await authenticateUser(req, res);

  if (!user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
    return;
  }

  const { success, data, error } = z.object({
    url: z.string(),
  }).safeParse(req.body);

  if (!success) {
    res.status(400).json({
      success: false,
      message: "Invalid request body: " + error.toString(),
    });
    return
  }

  const regex = /\/f\/([a-zA-Z0-9]+)$/;
  const match = regex.exec(data.url);

  if (!match?.[1]) {
    res.status(400).json({
      success: false,
      message: "Invalid URL format",
    });
    return;
  }

  const fileKey = match[1];

  try {
    const deleteDetails = await utapi.deleteFiles(fileKey);
    if (!deleteDetails.success)
      throw new Error("Failed to delete file");
    res.status(200).json({
      success: true,
      message: "File deleted successfully",
      details: deleteDetails,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
})


export { router as UTApiRouter };
