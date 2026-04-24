variable "project_id" {
  description = "GCP project ID hosting the Enterprise Search workload."
  type        = string
}

variable "region" {
  description = "Primary GCP region."
  type        = string
  default     = "us-central1"
}

variable "network_name" {
  description = "Name of the private VPC."
  type        = string
  default     = "enterprise-search-vpc"
}

variable "subnet_app_cidr" {
  description = "CIDR for the application subnet (FastAPI, frontend)."
  type        = string
  default     = "10.10.1.0/24"
}

variable "subnet_data_cidr" {
  description = "CIDR for the data subnet (Elasticsearch, Pinecone connector)."
  type        = string
  default     = "10.10.2.0/24"
}

variable "iap_source_ranges" {
  description = "IAP CIDR ranges allowed to reach port 443."
  type        = list(string)
  default     = ["35.235.240.0/20"]
}

variable "app_ports" {
  description = "Ports exposed inside the app subnet."
  type        = list(string)
  default     = ["443", "8000", "3000"]
}

variable "data_ports" {
  description = "Ports the app subnet may reach in the data subnet."
  type        = list(string)
  default     = ["9200", "9300"]
}

variable "labels" {
  description = "Default labels applied to all resources."
  type        = map(string)
  default = {
    system = "enterprise-search"
    owner  = "platform"
  }
}
