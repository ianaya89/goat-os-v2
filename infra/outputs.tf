output "buckets" {
  description = "S3 bucket information"
  value = {
    for k, v in aws_s3_bucket.storage : k => {
      name        = v.id
      arn         = v.arn
      region      = v.region
      domain_name = v.bucket_domain_name
    }
  }
}

output "iam_users" {
  description = "IAM user information"
  value = {
    for k, v in aws_iam_user.storage_user : k => {
      name = v.name
      arn  = v.arn
    }
  }
}

output "access_keys" {
  description = "IAM access keys"
  value = {
    for k, v in aws_iam_access_key.storage_user_key : k => {
      access_key_id     = v.id
      secret_access_key = v.secret
    }
  }
  sensitive = true
}
