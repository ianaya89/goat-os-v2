variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "buckets" {
  description = "Map of S3 buckets to create"
  type = map(object({
    environment         = string
    enable_versioning   = bool
    block_public_access = bool
  }))
}
