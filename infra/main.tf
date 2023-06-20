terraform {
  required_providers {
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
  }
  backend "kubernetes" {
    namespace     = "terraform-backend"
    secret_suffix = "rsb-config"
    config_path   = "~/.kube/config"
  }
}

locals {
  namespace = "rsb-config"
  name      = "rsb-config"
  hosts     = ["config.rsb.home"]
}

variable "image_tag" {
  type = string
}

variable "rsb_admin_username" {
  default = "admin"
  type    = string
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}


resource "kubernetes_namespace_v1" "ns" {
  metadata {
    name = local.namespace
  }
}

resource "random_password" "rsb_admin_password" {
  length  = 16
  special = true
}


resource "kubernetes_secret_v1" "env" {
  metadata {
    name      = local.name
    namespace = local.namespace
  }
  data = {
    RSB_ADMIN_PASSWORD = random_password.rsb_admin_password.result
    RSB_ADMIN_USERNAME = var.rsb_admin_username
    RSB_CONFIG_DIR     = "/mnt/config"
  }
}

resource "kubernetes_persistent_volume_claim_v1" "pvc" {
  metadata {
    name      = local.name
    namespace = local.namespace
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "20M"
      }
    }
    storage_class_name = "local-path"
  }
}

resource "kubernetes_service_v1" "service" {
  metadata {
    name      = local.name
    namespace = local.namespace
  }
  spec {
    selector = {
      app = kubernetes_deployment_v1.deploy.spec[0].selector[0].match_labels.app
    }

    port {
      protocol    = "TCP"
      port        = 3003
      target_port = 3003
    }
  }
}

resource "kubernetes_ingress_v1" "ing" {

  metadata {
    name      = local.name
    namespace = local.namespace
  }


  spec {
    dynamic "rule" {
      for_each = toset(local.hosts)
      content {
        host = rule.value
        http {
          path {
            backend {
              service {
                port {
                  number = kubernetes_service_v1.service.spec[0].port[0].port
                }
                name = kubernetes_service_v1.service.metadata[0].name
              }
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_deployment_v1" "deploy" {
  metadata {
    name      = local.name
    namespace = local.namespace
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = local.name
      }
    }

    template {
      metadata {
        labels = {
          app = local.name
        }
      }
      spec {
        container {
          name  = local.name
          image = "maxrsb/rsb-config:${var.image_tag}"
          env_from {
            secret_ref {
              name = kubernetes_secret_v1.env.metadata[0].name
            }
          }
          resources {
            limits = {
              cpu    = "100m"
              memory = "30Mi"
            }
            requests = {
              cpu    = "20m"
              memory = "5Mi"
            }
          }
          volume_mount {
            name       = local.name
            mount_path = "/mnt"
          }
        }

        volume {
          name = local.name
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim_v1.pvc.metadata[0].name
          }
        }

      }
    }
  }
}

output "rsb_config_url" {
  value = "http://${local.name}.${local.namespace}.svc.cluster.local:3003"
}
