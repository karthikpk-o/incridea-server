import { utapi } from ".";
import { type RequestHandler } from "express";

type DeleteResult = {
  success: boolean;
  message: string;
  details?: unknown;
};

type DeleteFileRequestBody = {
  url: string;
};

export const deleteFileByUrl: RequestHandler<
  object,
  DeleteResult,
  DeleteFileRequestBody
> = async (req, res) => {
  const { url } = req.body;

  if (typeof url !== "string") {
    res.status(400).json({
      success: false,
      message: "Invalid request body: URL is required and must be a string",
    });
    return;
  }

  const regex = /\/f\/([a-zA-Z0-9]+)$/;
  const match = regex.exec(url);

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
    res.status(200).json({
      success: true,
      message: "File deleted successfully",
      details: deleteDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
};
