terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.40"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# -----------------------------------------------------------------------------
# Private VPC with no auto-created subnets.
# -----------------------------------------------------------------------------
resource "google_compute_network" "vpc" {
  name                            = var.network_name
  auto_create_subnetworks         = false
  routing_mode                    = "REGIONAL"
  delete_default_routes_on_create = false
}

# App subnet — FastAPI backend + Next.js frontend.
resource "google_compute_subnetwork" "app" {
  name                     = "subnet-app"
  network                  = google_compute_network.vpc.id
  region                   = var.region
  ip_cidr_range            = var.subnet_app_cidr
  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Data subnet — Elasticsearch, Pinecone connector, Firestore-private-access.
resource "google_compute_subnetwork" "data" {
  name                     = "subnet-data"
  network                  = google_compute_network.vpc.id
  region                   = var.region
  ip_cidr_range            = var.subnet_data_cidr
  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# -----------------------------------------------------------------------------
# Firewall — deny by default, allow the minimum explicitly.
# -----------------------------------------------------------------------------

# Block ALL inbound by default.
resource "google_compute_firewall" "deny_all_ingress" {
  name      = "es-deny-all-ingress"
  network   = google_compute_network.vpc.name
  direction = "INGRESS"
  priority  = 65534

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
}

# Allow IAP -> app subnet on 443 only. Browser traffic enters through IAP.
resource "google_compute_firewall" "allow_iap_to_app" {
  name      = "es-allow-iap-app"
  network   = google_compute_network.vpc.name
  direction = "INGRESS"
  priority  = 1000

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = var.iap_source_ranges
  target_tags   = ["es-app"]
}

# Internal traffic: app -> data on required ports only.
resource "google_compute_firewall" "allow_app_to_data" {
  name      = "es-allow-app-to-data"
  network   = google_compute_network.vpc.name
  direction = "INGRESS"
  priority  = 1100

  allow {
    protocol = "tcp"
    ports    = var.data_ports
  }

  source_ranges = [var.subnet_app_cidr]
  target_tags   = ["es-data"]
}

# Allow app <-> app on service ports for internal health checks.
resource "google_compute_firewall" "allow_app_internal" {
  name      = "es-allow-app-internal"
  network   = google_compute_network.vpc.name
  direction = "INGRESS"
  priority  = 1200

  allow {
    protocol = "tcp"
    ports    = var.app_ports
  }

  source_ranges = [var.subnet_app_cidr]
  target_tags   = ["es-app"]
}

# Explicit egress policy — everything goes through Cloud NAT / private access.
resource "google_compute_router" "nat_router" {
  name    = "es-nat-router"
  region  = var.region
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "es-nat"
  router                             = google_compute_router.nat_router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.app.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
