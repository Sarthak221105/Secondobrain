# -----------------------------------------------------------------------------
# Service accounts — least-privilege per component.
# -----------------------------------------------------------------------------

resource "google_service_account" "backend" {
  account_id   = "es-backend"
  display_name = "Enterprise Search backend"
}

resource "google_service_account" "indexer" {
  account_id   = "es-indexer"
  display_name = "Enterprise Search ingestion pipeline"
}

# -----------------------------------------------------------------------------
# Backend: embed queries, call Gemini, read Firestore audit, call DLP.
# -----------------------------------------------------------------------------

resource "google_project_iam_member" "backend_vertex_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_dlp_user" {
  project = var.project_id
  role    = "roles/dlp.user"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_kms_decrypter" {
  project = var.project_id
  role    = "roles/cloudkms.cryptoKeyDecrypter"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# Firebase Admin SDK — verifying JWTs and setting custom claims (admin only).
resource "google_project_iam_member" "backend_firebase_admin" {
  project = var.project_id
  role    = "roles/firebaseauth.admin"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# -----------------------------------------------------------------------------
# Indexer: embeddings, DLP, encryption at rest.
# -----------------------------------------------------------------------------

resource "google_project_iam_member" "indexer_vertex_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.indexer.email}"
}

resource "google_project_iam_member" "indexer_dlp_user" {
  project = var.project_id
  role    = "roles/dlp.user"
  member  = "serviceAccount:${google_service_account.indexer.email}"
}

resource "google_project_iam_member" "indexer_kms_encrypter" {
  project = var.project_id
  role    = "roles/cloudkms.cryptoKeyEncrypter"
  member  = "serviceAccount:${google_service_account.indexer.email}"
}

resource "google_project_iam_member" "indexer_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.indexer.email}"
}

# -----------------------------------------------------------------------------
# KMS key ring + AES-256 key for document payload encryption at rest.
# -----------------------------------------------------------------------------

resource "google_kms_key_ring" "es" {
  name     = "enterprise-search"
  location = var.region
}

resource "google_kms_crypto_key" "documents" {
  name            = "documents"
  key_ring        = google_kms_key_ring.es.id
  purpose         = "ENCRYPT_DECRYPT"
  rotation_period = "7776000s" # 90 days

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION" # AES-256 GCM
    protection_level = "SOFTWARE"
  }

  lifecycle {
    prevent_destroy = true
  }
}
