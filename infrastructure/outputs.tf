output "vpc_id" {
  value       = google_compute_network.vpc.id
  description = "Full resource ID of the private VPC."
}

output "subnet_app_name" {
  value = google_compute_subnetwork.app.name
}

output "subnet_data_name" {
  value = google_compute_subnetwork.data.name
}

output "backend_service_account" {
  value       = google_service_account.backend.email
  description = "Email of the backend runtime service account."
}

output "indexer_service_account" {
  value       = google_service_account.indexer.email
  description = "Email of the ingestion pipeline service account."
}

output "kms_document_key" {
  value       = google_kms_crypto_key.documents.id
  description = "KMS key used to encrypt indexed documents at rest."
  sensitive   = true
}
