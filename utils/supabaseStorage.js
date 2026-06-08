const mongoose = require("mongoose");
const { createClient } = require("@supabase/supabase-js");

let supabaseClient = null;

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase configuration is missing");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return supabaseClient;
};

const getSupabaseStorageTarget = () => {
  const rawBucket = process.env.SUPABASE_BUCKET?.trim();

  if (!rawBucket) {
    throw new Error("Supabase bucket is missing");
  }

  const bucketParts = rawBucket
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  const bucket = bucketParts.shift();
  const prefix = bucketParts.join("/");

  if (!bucket || !/^[A-Za-z0-9._-]+$/.test(bucket)) {
    throw new Error("Supabase bucket name is invalid");
  }

  return { bucket, prefix };
};

const sanitizeStorageSegment = (value) =>
  String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const getFileExtension = (file) => {
  const originalExtension = sanitizeStorageSegment(
    file.originalname?.split(".").pop(),
  ).toLowerCase();

  if (originalExtension && originalExtension !== file.originalname) {
    return originalExtension;
  }

  return file.mimetype === "application/pdf"
    ? "pdf"
    : file.mimetype.split("/")[1];
};

const buildUploadPath = (file, user, prefix = "") => {
  const extension = getFileExtension(file);
  const fileTypeFolder =
    file.mimetype === "application/pdf" ? "pdfs" : "images";
  const ownerFolder = sanitizeStorageSegment(
    user?.role === "admin" ? user.id : user?.createdBy || user?.id,
  );
  const uniqueName = `${Date.now()}-${new mongoose.Types.ObjectId()}.${extension}`;

  return [prefix, fileTypeFolder, ownerFolder, uniqueName]
    .filter(Boolean)
    .join("/");
};

module.exports = {
  buildUploadPath,
  getSupabaseClient,
  getSupabaseStorageTarget,
};
