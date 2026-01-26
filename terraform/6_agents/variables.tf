variable "aws_region" {
  description = "AWS region for resources"
  type        = string
}

variable "aurora_cluster_arn" {
  description = "ARN of the Aurora cluster from Part 5"
  type        = string
  validation {
    condition     = length(trimspace(var.aurora_cluster_arn)) > 0 && can(regex("^arn:aws:rds:[a-z0-9-]+:\\d{12}:cluster:.+$", var.aurora_cluster_arn))
    error_message = "aurora_cluster_arn must be set to a valid Aurora cluster ARN (get it from terraform/5_database outputs)."
  }
}

variable "aurora_secret_arn" {
  description = "ARN of the Secrets Manager secret from Part 5"
  type        = string
  validation {
    condition     = length(trimspace(var.aurora_secret_arn)) > 0 && can(regex("^arn:aws:secretsmanager:[a-z0-9-]+:\\d{12}:secret:.+$", var.aurora_secret_arn))
    error_message = "aurora_secret_arn must be set to a valid Secrets Manager secret ARN (get it from terraform/5_database outputs)."
  }
}

variable "vector_bucket" {
  description = "S3 Vectors bucket name from Part 3"
  type        = string
}

variable "bedrock_model_id" {
  description = "Bedrock model ID to use for agents"
  type        = string
}

variable "bedrock_region" {
  description = "AWS region for Bedrock"
  type        = string
}

variable "sagemaker_endpoint" {
  description = "SageMaker endpoint name from Part 2"
  type        = string
  default     = "alex-embedding-endpoint"
}

variable "polygon_api_key" {
  description = "Polygon.io API key for market data"
  type        = string
}

variable "polygon_plan" {
  description = "Polygon.io plan type (free or paid)"
  type        = string
  default     = "free"
}

# LangFuse observability variables (optional)
variable "langfuse_public_key" {
  description = "LangFuse public key for observability (optional)"
  type        = string
  default     = ""
  sensitive   = false
}

variable "langfuse_secret_key" {
  description = "LangFuse secret key for observability (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "langfuse_host" {
  description = "LangFuse host URL (optional)"
  type        = string
  default     = "https://us.cloud.langfuse.com"
}

# OpenAI API key for tracing (required for OpenAI Agents SDK tracing)
variable "openai_api_key" {
  description = "OpenAI API key for enabling tracing in OpenAI Agents SDK"
  type        = string
  default     = ""
  sensitive   = true
}