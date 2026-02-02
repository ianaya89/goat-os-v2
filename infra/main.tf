resource "aws_s3_bucket" "storage" {
  for_each = var.buckets
  bucket   = each.key

  tags = {
    Name        = each.key
    Environment = each.value.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_versioning" "storage" {
  for_each = var.buckets
  bucket   = aws_s3_bucket.storage[each.key].id

  versioning_configuration {
    status = each.value.enable_versioning ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  for_each = var.buckets
  bucket   = aws_s3_bucket.storage[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "storage" {
  for_each = { for k, v in var.buckets : k => v if v.block_public_access }
  bucket   = aws_s3_bucket.storage[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "storage" {
  for_each = var.buckets
  bucket   = aws_s3_bucket.storage[each.key].id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# IAM User with access only to each bucket
resource "aws_iam_user" "storage_user" {
  for_each = var.buckets
  name     = "${each.key}-user"
  path     = "/service/"

  tags = {
    Name        = "${each.key}-user"
    Environment = each.value.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_policy" "storage_policy" {
  for_each    = var.buckets
  name        = "${each.key}-policy"
  description = "Policy for accessing ${each.key} S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListBucket"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = aws_s3_bucket.storage[each.key].arn
      },
      {
        Sid    = "ObjectOperations"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectAcl",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.storage[each.key].arn}/*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "storage_user_policy" {
  for_each   = var.buckets
  user       = aws_iam_user.storage_user[each.key].name
  policy_arn = aws_iam_policy.storage_policy[each.key].arn
}

resource "aws_iam_access_key" "storage_user_key" {
  for_each = var.buckets
  user     = aws_iam_user.storage_user[each.key].name
}
